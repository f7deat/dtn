using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Core.Interfaces.IRepositories;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;
using YouthUnion.Core.Services.Events.Models;
using YouthUnion.Infrastructure.Data;
using VnkCore.Data;
using THPIdentity.Entities;
using Microsoft.AspNetCore.Identity;
using THPCore.Interfaces;

namespace YouthUnion.Infrastructure.Repositories;

public class EventRepository(
    ApplicationDbContext context,
    IConfiguration configuration,
    UserManager<YouthUnionUser> userManager,
    IHCAService hcaService,
    IHttpContextAccessor httpContextAccessor) : EfRepository<Event>(context), IEventRepository
{
    private readonly ApplicationDbContext _dbContext = context;
    private readonly IConfiguration _configuration = configuration;
    private readonly UserManager<YouthUnionUser> _userManager = userManager;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly IHCAService _hcaService = hcaService;

    public async Task<THPResult> AddUserAsync(EventUserAddArgs args)
    {
        var eventExists = await _dbContext.Events.AnyAsync(x => x.Id == args.EventId);
        if (!eventExists) return THPResult.Failed("Không tìm thấy sự kiện!");

        var user = await _userManager.Users.FirstOrDefaultAsync(x => x.UserName == args.UserName);
        if (user is null)
        {
            var hpuniUser = await (from u in _dbContext.Users
                                   where u.UserName == args.UserName
                                   select new
                                   {
                                       u.Id,
                                       u.UserName,
                                       u.DepartmentId,
                                       u.Name,
                                       u.Email,
                                       u.Gender,
                                       u.DateOfBirth,
                                       u.PhoneNumber
                                   }).FirstOrDefaultAsync();
            if (hpuniUser is null) return THPResult.Failed("Không tìm thấy người dùng!");
            user = new YouthUnionUser
            {
                Id = Guid.NewGuid().ToString(),
                UserName = args.UserName,
                Status = UserStatus.Active,
                UserType = UserType.Student,
                DepartmentId = hpuniUser.DepartmentId,
                Name = hpuniUser.Name,
                PhoneNumber = hpuniUser.PhoneNumber,
                Gender = hpuniUser.Gender,
                Email = hpuniUser.Email,
                DateOfBirth = hpuniUser.DateOfBirth
            };
            await _userManager.CreateAsync(user);
        }

        var registrationExists = await _dbContext.UserEvents.AnyAsync(x => x.EventId == args.EventId && x.UserId == user.Id);
        if (registrationExists) return THPResult.Failed("Người dùng này đã có trong sự kiện!");

        await _dbContext.UserEvents.AddAsync(new UserEvent
        {
            EventId = args.EventId,
            UserId = user.Id
        });
        await _dbContext.SaveChangesAsync();
        return THPResult.Success;
    }

    public async Task<THPResult<EventCheckInExportData>> GetCheckInExportAsync(Guid eventId)
    {
        var eventItem = await _dbContext.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId);
        if (eventItem is null)
        {
            return THPResult<EventCheckInExportData>.Failed("Không tìm thấy sự kiện!");
        }

        var query = from ue in _dbContext.UserEvents.AsNoTracking()
                    join u in _dbContext.Users.AsNoTracking() on ue.UserId equals u.Id into userGroup
                    from user in userGroup.DefaultIfEmpty()
                    join d in _dbContext.Departments on user.DepartmentId equals d.Id into deptGroup
                    from dept in deptGroup.DefaultIfEmpty()
                    where ue.EventId == eventId
                    orderby ue.CheckedInAt descending, ue.CheckedInAt ascending
                    select new EventCheckInExportItem(
                        ue.UserId,
                        user.UserName,
                        user.Name,
                        user.Gender,
                        user.PhoneNumber,
                        user.DateOfBirth,
                        dept.Name,
                        ue.CheckedInAt,
                        ue.CheckedInBy,
                        ue.CheckedOutAt,
                        ue.CheckedOutBy
                        );

        var items = await query.ToListAsync();

        return THPResult<EventCheckInExportData>.Ok(new EventCheckInExportData(
            eventItem.Title,
            eventItem.StartDate,
            eventItem.EndDate,
            items));
    }

    public async Task<THPResult<object>> ScanQrAsync(EventCheckInArgs args)
    {
        if (string.IsNullOrWhiteSpace(args.QrCode))
        {
            return THPResult<object>.Failed("Mã QR không hợp lệ!");
        }

        var scanAction = NormalizeScanAction(args.Action);
        if (scanAction is null)
        {
            return THPResult<object>.Failed("Thao tác quét không hợp lệ!");
        }

        if (!TryReadQrCode(args.QrCode, out var payload))
        {
            return THPResult<object>.Failed("Không thể xác thực mã QR!");
        }

        if (args.EventId.HasValue && args.EventId.Value != payload.EventId)
        {
            return THPResult<object>.Failed("Mã QR không thuộc sự kiện đang chọn!");
        }

        var eventItem = await _dbContext.Events.FirstOrDefaultAsync(x => x.Id == payload.EventId);
        if (eventItem is null)
        {
            return THPResult<object>.Failed("Không tìm thấy sự kiện!");
        }

        var student = await _userManager.FindByIdAsync(payload.UserId);
        if (student is null)
        {
            return THPResult<object>.Failed("Không tìm thấy người tham gia!");
        }

        var userEvent = await _dbContext.UserEvents.FirstOrDefaultAsync(x => x.EventId == payload.EventId && x.UserId == payload.UserId);

        // For public events, auto-create UserEvent if not exists
        if (userEvent is null)
        {
            if (eventItem.EventType == EventType.Public && scanAction == ScanAction.CheckIn)
            {
                userEvent = new UserEvent
                {
                    EventId = payload.EventId,
                    UserId = payload.UserId
                };
                await _dbContext.UserEvents.AddAsync(userEvent);
                await _dbContext.SaveChangesAsync();
            }
            else
            {
                return THPResult<object>.Failed("Người tham gia chưa được thêm vào sự kiện!");
            }
        }

        var operatorUserName = _hcaService.GetUserName();
        var now = DateTime.Now;

        if (scanAction == ScanAction.CheckIn)
        {
            if (userEvent.CheckedInAt.HasValue)
            {
                return THPResult<object>.Failed($"Người tham gia đã check-in lúc {userEvent.CheckedInAt:HH:mm dd/MM/yyyy}.");
            }

            userEvent.CheckedInAt = now;
            userEvent.CheckedInBy = operatorUserName;
        }
        else
        {
            if (!userEvent.CheckedInAt.HasValue)
            {
                return THPResult<object>.Failed("Người tham gia chưa check-in nên chưa thể checkout.");
            }

            if (userEvent.CheckedOutAt.HasValue)
            {
                return THPResult<object>.Failed($"Người tham gia đã checkout lúc {userEvent.CheckedOutAt:HH:mm dd/MM/yyyy}.");
            }

            userEvent.CheckedOutAt = now;
            userEvent.CheckedOutBy = operatorUserName;
        }

        await _dbContext.SaveChangesAsync();

        var attendee = await (from user in _dbContext.Users
                              where user.UserName == student.UserName
                              select new
                              {
                                  user.Id,
                                  user.UserName,
                                  FullName = user.Name,
                              }).FirstOrDefaultAsync();

        return THPResult<object>.Ok(new
        {
            payload.EventId,
            payload.UserId,
            attendee?.UserName,
            attendee?.FullName,
            Action = scanAction == ScanAction.CheckIn ? "check-in" : "check-out",
            userEvent.CheckedInAt,
            userEvent.CheckedInBy,
            userEvent.CheckedOutAt,
            userEvent.CheckedOutBy,
            IsCheckedIn = userEvent.CheckedInAt.HasValue,
            IsCheckedOut = userEvent.CheckedOutAt.HasValue
        });
    }

    public async Task<THPResult<object>> GenerateQrAsync(EventUserQrArgs args)
    {
        var userEvent = await _dbContext.UserEvents.AnyAsync(x => x.EventId == args.EventId && x.UserId == args.UserId);
        if (!userEvent)
        {
            return THPResult<object>.Failed("Người tham gia chưa được thêm vào sự kiện!");
        }

        var attendee = await _userManager.FindByIdAsync(args.UserId);

        if (attendee is null)
        {
            return THPResult<object>.Failed("Không tìm thấy người tham gia!");
        }

        return THPResult<object>.Ok(new
        {
            args.EventId,
            attendee.Id,
            attendee.UserName,
            FullName = attendee.Name,
            QrCode = BuildQrCode(args.EventId, args.UserId)
        });
    }

    public async Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions)
    {
        if (!filterOptions.EventId.HasValue)
        {
            return await ListResult<object>.Success(Enumerable.Empty<object>().AsQueryable(), filterOptions);
        }

        try
        {
            var query = from userEvent in _context.UserEvents.AsNoTracking()
                        join user in _context.Users on userEvent.UserId equals user.Id
                        join dept in _context.Departments on user.DepartmentId equals dept.Id into deptGroup
                        from department in deptGroup.DefaultIfEmpty()
                        where userEvent.EventId == filterOptions.EventId.Value
                        select new
                        {
                            Id = userEvent.UserId,
                            userEvent.UserId,
                            userEvent.CheckedInAt,
                            userEvent.CheckedInBy,
                            userEvent.CheckedOutAt,
                            userEvent.CheckedOutBy,
                            IsCheckedIn = userEvent.CheckedInAt.HasValue,
                            IsCheckedOut = userEvent.CheckedOutAt.HasValue,
                            AttendanceStatus = userEvent.CheckedOutAt.HasValue ? "checked-out" : userEvent.CheckedInAt.HasValue ? "checked-in" : "not-checked-in",
                            user.Name,
                            user.DepartmentId,
                            user.DateOfBirth,
                            user.Gender,
                            user.Avatar,
                            user.UserName,
                            user.Email,
                            user.PhoneNumber,
                            DepartmentName = department != null ? department.Name : null
                        };

            if (!string.IsNullOrWhiteSpace(filterOptions.UserName))
            {
                query = query.Where(x => x.UserName == filterOptions.UserName);
            }

            if (!string.IsNullOrWhiteSpace(filterOptions.AttendanceStatus))
            {
                query = query.Where(x => x.AttendanceStatus == filterOptions.AttendanceStatus);
            }

            query = query.OrderByDescending(x => x.CheckedInAt).ThenByDescending(x => x.CheckedOutAt);

            return await ListResult<object>.Success(query, filterOptions);
        }
        catch (Exception ex)
        {
            return ListResult<object>.Failed(ex.ToString());
        }
    }

    public async Task<ListResult<object>> GetMyEventsAsync(FilterOptions filterOptions)
    {
        var currentUserId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return await ListResult<object>.Success(Enumerable.Empty<object>().AsQueryable(), filterOptions);
        }

        // Get events where user is registered
        try
        {
            var myRegisteredEvents = from userEvent in _dbContext.UserEvents.AsNoTracking()
                                     join eventItem in _dbContext.Events.AsNoTracking() on userEvent.EventId equals eventItem.Id
                                     where userEvent.UserId == currentUserId
                                     select new
                                     {
                                         eventItem.Id,
                                         eventItem.Title,
                                         eventItem.Description,
                                         eventItem.StartDate,
                                         eventItem.EndDate,
                                         eventItem.Thumbnail,
                                         eventItem.EventType,
                                         CheckedInAt = userEvent.CheckedInAt,
                                         CheckedInBy = userEvent.CheckedInBy,
                                         CheckedOutAt = userEvent.CheckedOutAt,
                                         CheckedOutBy = userEvent.CheckedOutBy,
                                         IsCheckedIn = userEvent.CheckedInAt.HasValue,
                                         IsCheckedOut = userEvent.CheckedOutAt.HasValue
                                     };

            // Get all public events
            var publicEvents = from eventItem in _dbContext.Events.AsNoTracking()
                               where eventItem.EventType == EventType.Public
                               select new
                               {
                                   eventItem.Id,
                                   eventItem.Title,
                                   eventItem.Description,
                                   eventItem.StartDate,
                                   eventItem.EndDate,
                                   eventItem.Thumbnail,
                                   eventItem.EventType,
                                   CheckedInAt = _dbContext.UserEvents.Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId).Select(x => x.CheckedInAt).FirstOrDefault(),
                                   CheckedInBy = _dbContext.UserEvents.Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId).Select(x => x.CheckedInBy).FirstOrDefault(),
                                   CheckedOutAt = _dbContext.UserEvents.Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId).Select(x => x.CheckedOutAt).FirstOrDefault(),
                                   CheckedOutBy = _dbContext.UserEvents.Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId).Select(x => x.CheckedOutBy).FirstOrDefault(),
                                   IsCheckedIn = _dbContext.UserEvents.Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId).Select(x => x.CheckedInAt.HasValue).FirstOrDefault(),
                                   IsCheckedOut = _dbContext.UserEvents.Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId).Select(x => x.CheckedOutAt.HasValue).FirstOrDefault()
                               };

            // Combine and remove duplicates
            var query = myRegisteredEvents.Union(publicEvents)
                                          .OrderByDescending(x => x.StartDate)
                                          .ThenBy(x => x.Title);

            return await ListResult<object>.Success(query, filterOptions);
        }
        catch (Exception ex)
        {
            return ListResult<object>.Failed(ex.ToString());
        }
    }

    public async Task<THPResult<object>> GetMyQrAsync(Guid eventId)
    {
        var currentUserId = _hcaService.GetUserId();
        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return THPResult<object>.Failed("Không xác định được người dùng hiện tại!");
        }

        var eventItem = await _dbContext.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId);
        if (eventItem is null)
        {
            return THPResult<object>.Failed("Không tìm thấy sự kiện!");
        }

        // For public events, allow all users to get QR
        // For limited events, user must be registered
        if (eventItem.EventType == EventType.Limited)
        {
            var userEvent = await _dbContext.UserEvents.AsNoTracking().AnyAsync(x => x.EventId == eventId && x.UserId == currentUserId);
            if (!userEvent)
            {
                return THPResult<object>.Failed("Bạn không có trong danh sách tham gia sự kiện này!");
            }
        }

        var attendee = await (from user in _userManager.Users
                              where user.Id == currentUserId
                              select new
                              {
                                  user.Id,
                                  user.UserName,
                                  FullName = user.Name
                              }).FirstOrDefaultAsync();

        if (attendee is null)
        {
            return THPResult<object>.Failed("Không tìm thấy thông tin sinh viên!");
        }

        return THPResult<object>.Ok(new
        {
            EventId = eventId,
            UserId = currentUserId,
            attendee.UserName,
            attendee.FullName,
            QrCode = BuildQrCode(eventId, currentUserId)
        });
    }

    public async Task<ListResult<object>> ListAsync(EventFilterOptions filterOptions)
    {
        try
        {
            var query = _dbContext.Events
            .AsNoTracking()
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Description,
                x.StartDate,
                x.EndDate,
                x.Thumbnail,
                x.EventType,
                RegistrationCount = _dbContext.UserEvents.Count(u => u.EventId == x.Id),
                CheckedInCount = _dbContext.UserEvents.Count(u => u.EventId == x.Id && u.CheckedInAt != null),
                CheckedOutCount = _dbContext.UserEvents.Count(u => u.EventId == x.Id && u.CheckedOutAt != null),
                x.AcademicYearId
            });

            if (!string.IsNullOrWhiteSpace(filterOptions.Title))
            {
                var keyword = filterOptions.Title.Trim().ToLower();
                query = query.Where(x => x.Title.ToLower().Contains(keyword));
            }

            query = query.OrderByDescending(x => x.StartDate).ThenBy(x => x.Title);
            return await ListResult<object>.Success(query, filterOptions);
        }
        catch (Exception ex)
        {
            return ListResult<object>.Failed(ex.ToString());
        }
    }

    public async Task<THPResult> RemoveUserAsync(EventUserRemoveArgs args)
    {
        var userEvent = await _dbContext.UserEvents.FirstOrDefaultAsync(x => x.EventId == args.EventId && x.UserId == args.UserId);
        if (userEvent is null)
        {
            return THPResult.Failed("Không tìm thấy người tham gia trong sự kiện!");
        }

        _dbContext.UserEvents.Remove(userEvent);
        await _dbContext.SaveChangesAsync();
        return THPResult.Success;
    }

    private string BuildQrCode(Guid eventId, string userId)
    {
        var payload = JsonSerializer.Serialize(new EventQrPayload(eventId, userId));
        var encodedPayload = Base64UrlEncode(Encoding.UTF8.GetBytes(payload));
        var signature = ComputeSignature(encodedPayload);
        return $"evt.{encodedPayload}.{signature}";
    }

    private string ComputeSignature(string encodedPayload)
    {
        var secret = _configuration["EventQr:Secret"] ?? _configuration["JWT:Secret"] ?? string.Empty;
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(encodedPayload));
        return Base64UrlEncode(hash);
    }

    private bool TryReadQrCode(string qrCode, out EventQrPayload payload)
    {
        payload = default!;
        var segments = qrCode.Trim().Split('.');
        if (segments.Length != 3 || !string.Equals(segments[0], "evt", StringComparison.Ordinal))
        {
            return false;
        }

        if (!string.Equals(ComputeSignature(segments[1]), segments[2], StringComparison.Ordinal))
        {
            return false;
        }

        try
        {
            var json = Encoding.UTF8.GetString(Base64UrlDecode(segments[1]));
            var value = JsonSerializer.Deserialize<EventQrPayload>(json);
            if (value is null)
            {
                return false;
            }

            payload = value;
            return true;
        }
        catch
        {
            return false;
        }
    }

    private string? GetCurrentUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        return user?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user?.FindFirstValue("nameid")
            ?? user?.FindFirstValue("sub")
            ?? user?.FindFirstValue("id");
    }

    private static string Base64UrlEncode(byte[] value)
    {
        return Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        var remainder = padded.Length % 4;
        if (remainder > 0)
        {
            padded = padded.PadRight(padded.Length + (4 - remainder), '=');
        }

        return Convert.FromBase64String(padded);
    }

    private static ScanAction? NormalizeScanAction(string? action)
    {
        if (string.IsNullOrWhiteSpace(action) || string.Equals(action, "check-in", StringComparison.OrdinalIgnoreCase))
        {
            return ScanAction.CheckIn;
        }

        if (string.Equals(action, "check-out", StringComparison.OrdinalIgnoreCase))
        {
            return ScanAction.CheckOut;
        }

        return null;
    }

    private sealed record EventQrPayload(Guid EventId, string UserId);

    private enum ScanAction
    {
        CheckIn,
        CheckOut
    }
}
