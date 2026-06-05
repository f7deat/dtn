using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using THPCore.Interfaces;
using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.ExternalAPI;
using YouthUnion.ExternalAPI.Models.Response;
using YouthUnion.Infrastructure.Data;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Contests;

namespace YouthUnion.Services;

public class ContestService(
    ApplicationDbContext _context,
    IHCAService _hcaService,
    IWebHostEnvironment _webHostEnvironment,
    IHttpContextAccessor _httpContextAccessor, ILogService _logService,
    IHemsService _hemsService) : IContestService
{
    public async Task<THPResult> CreateAsync(ContestCreateArgs args)
    {
        var validation = ValidateContestDates(args.StartDate, args.EndDate);
        if (validation is not null)
        {
            return validation;
        }

        var contest = new Contest
        {
            Title = args.Title.Trim(),
            Description = args.Description?.Trim(),
            Content = args.Content,
            StartDate = args.StartDate,
            EndDate = args.EndDate,
            IsActive = args.IsActive,
            CreatedBy = _hcaService.GetUserName(),
            CreatedDate = DateTime.Now,
        };
        await _logService.AddAsync($"Tạo mới cuộc thi: {contest.Title}");
        await _context.Contests.AddAsync(contest);

        await _context.SaveChangesAsync();
        return THPResult.Ok(contest.Id);
    }

    public async Task<THPResult> UpdateAsync(ContestUpdateArgs args)
    {
        var validation = ValidateContestDates(args.StartDate, args.EndDate);
        if (validation is not null)
        {
            return validation;
        }

        var contest = await _context.Contests.FindAsync(args.Id);
        if (contest is null)
        {
            return THPResult.Failed("Không tìm thấy cuộc thi.");
        }

        contest.Title = args.Title.Trim();
        contest.Description = args.Description?.Trim();
        contest.Content = args.Content;
        contest.StartDate = args.StartDate;
        contest.EndDate = args.EndDate;
        contest.IsActive = args.IsActive;
        contest.ModifiedBy = _hcaService.GetUserName();
        contest.ModifiedDate = DateTime.Now;

        _context.Contests.Update(contest);
        await _logService.AddAsync($"Cập nhật cuộc thi: {contest.Title}");
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    public async Task<THPResult> DeleteAsync(Guid id)
    {
        var contest = await _context.Contests
            .Include(x => x.Submissions)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (contest is null)
        {
            return THPResult.Failed("Không tìm thấy cuộc thi.");
        }
        if (await _context.ContestSubmissions.AnyAsync(x => x.ContestId == id))
        {
            return THPResult.Failed("Không thể xóa cuộc thi vì đã có bài dự thi.");
        }

        if (contest.Submissions is not null)
        {
            foreach (var submission in contest.Submissions)
            {
                DeletePhysicalFile(submission.StoredFilePath);
            }
            _context.ContestSubmissions.RemoveRange(contest.Submissions);
        }

        _context.Contests.Remove(contest);
        await _logService.AddAsync($"Xóa cuộc thi: {contest.Title}");
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    public async Task<ListResult<ContestListItem>> ListAsync(ContestFilterOptions filterOptions, bool onlyActive)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var query = _context.Contests
            .Select(x => new ContestListItem
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                Content = x.Content,
                StartDate = x.StartDate,
                EndDate = x.EndDate,
                IsActive = x.IsActive,
                CreatedBy = x.CreatedBy,
                CreatedDate = x.CreatedDate,
                ModifiedBy = x.ModifiedBy,
                ModifiedDate = x.ModifiedDate,
                SubmissionCount = _context.ContestSubmissions.Count(s => s.ContestId == x.Id),
                IsOpened = x.IsActive && x.StartDate <= today && x.EndDate >= today,
                HasEnded = x.EndDate < today,
            });

        if (!string.IsNullOrWhiteSpace(filterOptions.Title))
        {
            var keyword = filterOptions.Title.Trim().ToLower();
            query = query.Where(x => x.Title.ToLower().Contains(keyword) || (x.Description ?? string.Empty).ToLower().Contains(keyword));
        }

        if (onlyActive)
        {
            query = query.Where(x => x.IsActive);
        }
        else if (filterOptions.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == filterOptions.IsActive.Value);
        }

        if (filterOptions.IsOpened.HasValue)
        {
            query = filterOptions.IsOpened.Value ? query.Where(x => x.IsOpened) : query.Where(x => !x.IsOpened);
        }

        query = query.OrderByDescending(x => x.CreatedDate).ThenByDescending(x => x.StartDate);
        return await ListResult<ContestListItem>.Success(query, filterOptions);
    }

    public async Task<object?> GetAsync(Guid id, bool onlyActive)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var query = _context.Contests.Select(x => new ContestListItem
        {
            Id = x.Id,
            Title = x.Title,
            Description = x.Description,
            Content = x.Content,
            StartDate = x.StartDate,
            EndDate = x.EndDate,
            IsActive = x.IsActive,
            CreatedBy = x.CreatedBy,
            CreatedDate = x.CreatedDate,
            ModifiedBy = x.ModifiedBy,
            ModifiedDate = x.ModifiedDate,
            SubmissionCount = _context.ContestSubmissions.Count(s => s.ContestId == x.Id),
            IsOpened = x.IsActive && x.StartDate <= today && x.EndDate >= today,
            HasEnded = x.EndDate < today,
        });

        if (onlyActive)
        {
            query = query.Where(x => x.IsActive);
        }

        return await query.FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<ListResult<ContestSubmissionItem>> GetSubmissionsAsync(Guid contestId, ContestSubmissionFilterOptions filterOptions)
    {
        var contestExists = await _context.Contests.AnyAsync(x => x.Id == contestId);
        if (!contestExists)
        {
            return ListResult<ContestSubmissionItem>.Failed("Không tìm thấy cuộc thi.");
        }

        var query = _context.ContestSubmissions
            .Where(x => x.ContestId == contestId)
            .Select(x => new ContestSubmissionItem
            {
                Id = x.Id,
                ContestId = x.ContestId,
                UserId = x.UserId,
                UserName = x.UserName,
                FullName = x.FullName,
                Email = x.Email,
                PhoneNumber = x.PhoneNumber,
                OriginalFileName = x.OriginalFileName,
                FileUrl = x.FileUrl,
                Note = x.Note,
                Status = x.Status,
                AdminNote = x.AdminNote,
                SubmittedAt = x.SubmittedAt,
                CreatedBy = x.CreatedBy,
                CreatedDate = x.CreatedDate,
                ModifiedBy = x.ModifiedBy,
                ModifiedDate = x.ModifiedDate,
            });

        if (!string.IsNullOrWhiteSpace(filterOptions.Keyword))
        {
            var keyword = filterOptions.Keyword.Trim().ToLower();
            query = query.Where(x =>
                x.UserName.ToLower().Contains(keyword) ||
                (x.FullName ?? string.Empty).ToLower().Contains(keyword) ||
                (x.Email ?? string.Empty).ToLower().Contains(keyword));
        }

        query = query.OrderByDescending(x => x.SubmittedAt);
        return await ListResult<ContestSubmissionItem>.Success(query, filterOptions);
    }

    public async Task<List<ContestSubmissionItem>> GetMySubmissionsAsync(Guid contestId)
    {
        var userId = _hcaService.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return [];
        }

        return await _context.ContestSubmissions
            .Where(x => x.ContestId == contestId && x.UserId == userId)
            .OrderByDescending(x => x.SubmittedAt)
            .Select(x => new ContestSubmissionItem
            {
                Id = x.Id,
                ContestId = x.ContestId,
                UserId = x.UserId,
                UserName = x.UserName,
                FullName = x.FullName,
                Email = x.Email,
                PhoneNumber = x.PhoneNumber,
                OriginalFileName = x.OriginalFileName,
                FileUrl = x.FileUrl,
                Note = x.Note,
                Status = x.Status,
                AdminNote = x.AdminNote,
                SubmittedAt = x.SubmittedAt,
                CreatedBy = x.CreatedBy,
                CreatedDate = x.CreatedDate,
                ModifiedBy = x.ModifiedBy,
                ModifiedDate = x.ModifiedDate,
            })
            .ToListAsync();
    }

    public async Task<THPResult> UpdateSubmissionStatusAsync(ContestSubmissionStatusUpdateArgs args)
    {
        var submission = await _context.ContestSubmissions.FirstOrDefaultAsync(x => x.Id == args.SubmissionId);
        if (submission is null)
        {
            return THPResult.Failed("Không tìm thấy bài dự thi.");
        }

        if (args.Status == ContestSubmissionStatus.Rejected && string.IsNullOrWhiteSpace(args.AdminNote))
        {
            return THPResult.Failed("Vui lòng nhập ghi chú khi từ chối bài dự thi.");
        }

        submission.Status = args.Status;
        submission.AdminNote = string.IsNullOrWhiteSpace(args.AdminNote) ? null : args.AdminNote.Trim();
        submission.ModifiedBy = _hcaService.GetUserName();
        submission.ModifiedDate = DateTime.Now;
        _context.ContestSubmissions.Update(submission);
        await _logService.AddAsync($"Cập nhật trạng thái bài dự thi (ID: {submission.Id}) thành {submission.Status}");
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    public async Task<THPResult> DeleteSubmissionAsync(Guid submissionId)
    {
        var submission = await _context.ContestSubmissions.FirstOrDefaultAsync(x => x.Id == submissionId);
        if (submission is null)
        {
            return THPResult.Failed("Không tìm thấy bài dự thi.");
        }

        DeletePhysicalFile(submission.StoredFilePath);
        _context.ContestSubmissions.Remove(submission);
        await _logService.AddAsync($"Xóa bài dự thi (ID: {submission.Id})");
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    public async Task<THPResult> SubmitAsync(Guid contestId, IFormFile file, string? note)
    {
        if (file.Length == 0)
        {
            return THPResult.Failed("File không hợp lệ.");
        }

        if (!string.Equals(Path.GetExtension(file.FileName), ".pdf", StringComparison.OrdinalIgnoreCase))
        {
            return THPResult.Failed("Chỉ chấp nhận file PDF.");
        }

        var userId = _hcaService.GetUserId();
        var userName = _hcaService.GetUserName();
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(userName))
        {
            return THPResult.Failed("Không xác định được sinh viên nộp bài.");
        }

        var contest = await _context.Contests.FirstOrDefaultAsync(x => x.Id == contestId);
        if (contest is null)
        {
            return THPResult.Failed("Không tìm thấy cuộc thi.");
        }

        var today = DateOnly.FromDateTime(DateTime.Today);
        if (!contest.IsActive)
        {
            return THPResult.Failed("Cuộc thi đang tạm dừng nhận bài.");
        }

        if (contest.StartDate > today || contest.EndDate < today)
        {
            return THPResult.Failed("Cuộc thi hiện không trong thời gian nhận bài.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
        var savedFile = await SaveSubmissionFileAsync(contestId, userId, file);
        if (savedFile is null)
        {
            return THPResult.Failed("Không thể lưu file bài dự thi.");
        }

        var savedFileValue = savedFile.Value;

        var now = DateTime.Now;
        var submission = new ContestSubmission
        {
            ContestId = contestId,
            UserId = userId,
            UserName = userName,
            FullName = user?.Name,
            Email = user?.Email,
            PhoneNumber = user?.PhoneNumber,
            OriginalFileName = file.FileName,
            FileUrl = savedFileValue.FileUrl,
            StoredFilePath = savedFileValue.StoredFilePath,
            Note = note?.Trim(),
            Status = ContestSubmissionStatus.Approved,
            AdminNote = null,
            SubmittedAt = now,
            CreatedBy = userName,
            CreatedDate = now,
        };

        await _context.ContestSubmissions.AddAsync(submission);
        await _logService.AddAsync($"Sinh viên {userName} nộp bài dự thi cho cuộc thi {contest.Title} (ID: {submission.Id})");
        await _context.SaveChangesAsync();
        return THPResult.Ok(new
        {
            submission.Id,
            submission.FileUrl,
            submission.OriginalFileName,
            submission.Note,
            submission.SubmittedAt,
        });
    }

    public async Task<(string ContestTitle, List<ContestSubmissionItem> Items)?> GetSubmissionExportAsync(Guid contestId)
    {
        var contest = await _context.Contests.FirstOrDefaultAsync(x => x.Id == contestId);
        if (contest is null)
        {
            return null;
        }

        var items = await _context.ContestSubmissions
            .Where(x => x.ContestId == contestId)
            .OrderByDescending(x => x.SubmittedAt)
            .AsNoTracking()
            .Select(x => new ContestSubmissionItem
            {
                Id = x.Id,
                ContestId = x.ContestId,
                UserId = x.UserId,
                UserName = x.UserName,
                FullName = x.FullName,
                Email = x.Email,
                PhoneNumber = x.PhoneNumber,
                OriginalFileName = x.OriginalFileName,
                FileUrl = x.FileUrl,
                Note = x.Note,
                Status = x.Status,
                AdminNote = x.AdminNote,
                SubmittedAt = x.SubmittedAt,
                CreatedBy = x.CreatedBy,
                CreatedDate = x.CreatedDate,
                ModifiedBy = x.ModifiedBy,
                ModifiedDate = x.ModifiedDate
            })
            .ToListAsync();
        
        var userNames = items.Select(i => i.UserName).Distinct().ToList();
        if (userNames != null && userNames.Count > 0)
        {
            var userInfos = new List<ListByUserNamesResponse>();

            var pageSize = 1000;
            var totalPages = (int)Math.Ceiling(userNames.Count / (double)pageSize);
            foreach (var page in Enumerable.Range(0, totalPages))
            {
                var batchUserNames = userNames.Skip(page * pageSize).Take(pageSize).ToList();
                var batchUserInfos = await _hemsService.ListByUserNamesAsync(batchUserNames!);
                if (batchUserInfos?.Data != null)
                {
                    userInfos.AddRange(batchUserInfos.Data);
                }
            }

            if (userInfos is not null)
            {
                foreach (var item in items)
                {
                    var userInfo = userInfos?.FirstOrDefault(x => x.UserName == item.UserName);
                    if (userInfo is not null)
                    {
                        item.CourseName = userInfo.CourseName;
                        item.ClassName = userInfo.ClassCode;
                        item.FacultyName = userInfo.DepartmentName;
                    }
                }
            }
        }

        return (contest.Title, items);
    }

    private static THPResult? ValidateContestDates(DateOnly startDate, DateOnly endDate)
    {
        if (endDate < startDate)
        {
            return THPResult.Failed("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
        }

        return null;
    }

    private async Task<(string FileUrl, string StoredFilePath)?> SaveSubmissionFileAsync(Guid contestId, string userId, IFormFile file)
    {
        var uploadsRoot = _webHostEnvironment.WebRootPath;
        if (string.IsNullOrWhiteSpace(uploadsRoot))
        {
            return null;
        }

        var safeFileName = BuildSafeFileName(file.FileName);
        var contestFolder = Path.Combine(uploadsRoot, "contest-submissions", contestId.ToString(), userId);
        if (!Directory.Exists(contestFolder))
        {
            Directory.CreateDirectory(contestFolder);
        }

        var storedFileName = $"{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid():N}{Path.GetExtension(safeFileName)}";
        var storedFilePath = Path.Combine(contestFolder, storedFileName);
        await using (var stream = System.IO.File.Create(storedFilePath))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/contest-submissions/{contestId}/{userId}/{storedFileName}";
        var request = _httpContextAccessor.HttpContext?.Request;
        var fileUrl = request is null
            ? relativeUrl
            : $"{request.Scheme}://{request.Host}{relativeUrl}";
        return (fileUrl, storedFilePath);
    }

    private static string BuildSafeFileName(string fileName)
    {
        var sanitized = Regex.Replace(fileName, "[^a-zA-Z0-9._-]", "_");
        return string.IsNullOrWhiteSpace(sanitized) ? "submission.pdf" : sanitized;
    }

    private static void DeletePhysicalFile(string? storedFilePath)
    {
        if (string.IsNullOrWhiteSpace(storedFilePath))
        {
            return;
        }

        if (System.IO.File.Exists(storedFilePath))
        {
            System.IO.File.Delete(storedFilePath);
        }
    }
}