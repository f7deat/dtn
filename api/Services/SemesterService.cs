using Microsoft.EntityFrameworkCore;
using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Infrastructure.Data;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Semesters;

namespace YouthUnion.Services;

public class SemesterService(ApplicationDbContext _context) : ISemesterService
{
    public async Task<THPResult> CreateAsync(SemesterCreateRequest request)
    {
        var validationResult = await ValidateRequestAsync(request);
        if (!validationResult.Succeeded)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();
        if (await _context.Semesters.AnyAsync(x => x.AcademicYearId == request.AcademicYearId && x.Name == normalizedName))
            return THPResult.Failed("Kỳ học đã tồn tại trong năm học này");

        await _context.Semesters.AddAsync(new Semester
        {
            Name = normalizedName,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            AcademicYearId = request.AcademicYearId
        });
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    public async Task<THPResult> DeleteAsync(int id)
    {
        var semester = await _context.Semesters.FindAsync(id);
        if (semester is null) return THPResult.Failed("Không tìm thấy kỳ học");

        _context.Semesters.Remove(semester);
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    public Task<ListResult<object>> ListAsync(SemesterFilterOptions filterOptions)
    {
        var query = from s in _context.Semesters
                    join ay in _context.AcademicYears on s.AcademicYearId equals ay.Id
                    select new
                    {
                        s.Id,
                        s.Name,
                        s.StartDate,
                        s.EndDate,
                        s.AcademicYearId,
                        AcademicYearName = ay.Name
                    };

        if (!string.IsNullOrWhiteSpace(filterOptions.Name))
        {
            var keyword = filterOptions.Name.Trim();
            query = query.Where(x => x.Name.Contains(keyword));
        }

        if (filterOptions.AcademicYearId.HasValue)
        {
            query = query.Where(x => x.AcademicYearId == filterOptions.AcademicYearId.Value);
        }

        query = query.OrderByDescending(x => x.StartDate);
        return ListResult<object>.Success(query, filterOptions);
    }

    public async Task<object?> OptionsAsync(int? academicYearId)
    {
        var query = _context.Semesters.AsQueryable();
        if (academicYearId.HasValue)
        {
            query = query.Where(x => x.AcademicYearId == academicYearId.Value);
        }

        return await query
            .OrderByDescending(x => x.StartDate)
            .Select(x => new
            {
                Value = x.Id,
                Label = x.Name,
                x.StartDate,
                x.EndDate,
                x.AcademicYearId
            })
            .ToListAsync();
    }

    public async Task<THPResult> UpdateAsync(SemesterUpdateRequest request)
    {
        var semester = await _context.Semesters.FindAsync(request.Id);
        if (semester is null) return THPResult.Failed("Không tìm thấy kỳ học");

        var validationResult = await ValidateRequestAsync(request);
        if (!validationResult.Succeeded)
        {
            return validationResult;
        }

        var normalizedName = request.Name.Trim();
        if (await _context.Semesters.AnyAsync(x => x.Id != request.Id && x.AcademicYearId == request.AcademicYearId && x.Name == normalizedName))
            return THPResult.Failed("Kỳ học đã tồn tại trong năm học này");

        semester.Name = normalizedName;
        semester.StartDate = request.StartDate;
        semester.EndDate = request.EndDate;
        semester.AcademicYearId = request.AcademicYearId;
        _context.Semesters.Update(semester);
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    private async Task<THPResult> ValidateRequestAsync(SemesterCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return THPResult.Failed("Tên kỳ học không được để trống");
        if (request.StartDate > request.EndDate) return THPResult.Failed("Ngày bắt đầu không được lớn hơn ngày kết thúc");

        var academicYear = await _context.AcademicYears.FindAsync(request.AcademicYearId);
        if (academicYear is null) return THPResult.Failed("Không tìm thấy năm học");

        if (request.StartDate < academicYear.StartDate || request.EndDate > academicYear.EndDate)
            return THPResult.Failed("Khoảng thời gian kỳ học phải nằm trong năm học");

        return THPResult.Success;
    }
}