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
    VnkDbContext vnkContext,
    IConfiguration configuration,
    IdentityDbTHPContext userContext,
    UserManager<ApplicationUser> userManager,
    IHCAService hcaService,
    IHttpContextAccessor httpContextAccessor) : EfRepository<Event>(context), IEventRepository
{
    private readonly ApplicationDbContext _dbContext = context;
    private readonly VnkDbContext _vnkContext = vnkContext;
    private readonly IConfiguration _configuration = configuration;
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly IdentityDbTHPContext _userContext = userContext;
    private readonly IHCAService _hcaService = hcaService;

    public async Task<THPResult> AddUserAsync(EventUserAddArgs args)
    {
        var eventExists = await _dbContext.Events.AnyAsync(x => x.Id == args.EventId);
        if (!eventExists) return THPResult.Failed("Không tìm thấy sự kiện!");

        var user = await _userContext.Users.FirstOrDefaultAsync(x => x.UserName == args.UserName);
        if (user is null)
        {
            var hpuniUser = await (from u in _vnkContext.Users
                                   join ud in _vnkContext.UserDetails on u.Id equals ud.UserId
                                   where u.UserName == args.UserName
                                   select new
                                   {
                                       u.Id,
                                       u.UserName,
                                       u.DepartmentId,
                                       u.LastName,
                                       u.FirstName,
                                       u.Email,
                                       ud.Gender,
                                       ud.DateOfBirth,
                                       u.PhoneNumber
                                   }).FirstOrDefaultAsync();
            if (hpuniUser is null) return THPResult.Failed("Không tìm thấy người dùng!");
            user = new ApplicationUser
            {
                Id = Guid.NewGuid().ToString(),
                UserName = args.UserName,
                Status = UserStatus.Active,
                UserType = UserType.Student,
                DepartmentId = hpuniUser.DepartmentId,
                Name = hpuniUser.LastName + " " + hpuniUser.FirstName,
                PhoneNumber = hpuniUser.PhoneNumber,
                Gender = hpuniUser.Gender == 1,
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

        var checkIns = await _dbContext.UserEvents
            .AsNoTracking()
            .Where(x => x.EventId == eventId)
            .OrderByDescending(x => x.CheckedInAt)
            .ThenBy(x => x.CheckedInAt)
            .Select(x => new
            {
                x.UserId,
                x.CheckedInAt,
                x.CheckedInBy
            })
            .ToListAsync();

        var userIds = checkIns.Select(x => x.UserId).ToList();
        var users = await _userContext.Users
            .Where(x => userIds.Contains(x.Id))
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.UserName,
                x.Gender,
                x.PhoneNumber,
                x.DateOfBirth
            })
            .ToListAsync();

        var userNames = users.Select(u => u.UserName).ToList();
        var userClass = from u in _vnkContext.Users
                        join d in _vnkContext.Departments on u.DepartmentId equals d.Id
                        join uc in _vnkContext.ClassUsers on u.Id equals uc.UserId
                        join c in _vnkContext.Classes on uc.ClassId equals c.Id
                        where u.UserType == UserType.Student && userNames.Contains(u.UserName)
                        select new
                        {
                            u.UserName,
                            u.ClassCode,
                            DepartmentName = d.Name
                        };

        var items = checkIns.Select(x =>
        {
            var user = users.FirstOrDefault(u => u.Id == x.UserId);
            var classInfo = user is null ? null : userClass.FirstOrDefault(c => c.UserName == user.UserName);
            return new EventCheckInExportItem(
                x.UserId,
                user?.UserName,
                user?.Name,
                user?.Gender,
                user?.PhoneNumber,
                user?.DateOfBirth,
                classInfo?.ClassCode,
                classInfo?.DepartmentName,
                x.CheckedInAt,
                x.CheckedInBy);
        }).ToList();

        return THPResult<EventCheckInExportData>.Ok(new EventCheckInExportData(
            eventItem.Title,
            eventItem.StartDate,
            eventItem.EndDate,
            items));
    }

    public async Task<THPResult<object>> CheckInAsync(EventCheckInArgs args)
    {
        if (string.IsNullOrWhiteSpace(args.QrCode))
        {
            return THPResult<object>.Failed("Mã QR không hợp lệ!");
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
            if (eventItem.EventType == EventType.Public)
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

        if (userEvent.CheckedInAt.HasValue)
        {
            return THPResult<object>.Failed($"Người tham gia đã check-in lúc {userEvent.CheckedInAt:HH:mm dd/MM/yyyy}.");
        }

        userEvent.CheckedInAt = DateTime.Now;
        userEvent.CheckedInBy = _hcaService.GetUserName();
        await _dbContext.SaveChangesAsync();

        var attendee = await (from user in _vnkContext.Users
                              join detail in _vnkContext.UserDetails on user.Id equals detail.UserId into userDetails
                              from detail in userDetails.DefaultIfEmpty()
                              where user.UserName == student.UserName
                              select new
                              {
                                  user.Id,
                                  user.UserName,
                                  FullName = user.FirstName + " " + user.LastName,
                                  user.ClassCode,
                                  user.ClassName
                              }).FirstOrDefaultAsync();

        return THPResult<object>.Ok(new
        {
            payload.EventId,
            payload.UserId,
            attendee?.UserName,
            attendee?.FullName,
            attendee?.ClassCode,
            attendee?.ClassName,
            userEvent.CheckedInAt,
            userEvent.CheckedInBy
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
                        where userEvent.EventId == filterOptions.EventId.Value
                        select new
                        {
                            Id = userEvent.UserId,
                            userEvent.UserId,
                            userEvent.CheckedInAt,
                            userEvent.CheckedInBy,
                            IsCheckedIn = userEvent.CheckedInAt.HasValue
                        };

            if (!string.IsNullOrWhiteSpace(filterOptions.UserName))
            {
                var user = await _userContext.Users.FirstOrDefaultAsync(x => x.UserName == filterOptions.UserName);
                if (user is null) return new ListResult<object>([], 0, filterOptions);
                query = query.Where(x => x.UserId == user.Id);
            }

            if (filterOptions.IsCheckedIn.HasValue)
            {
                query = query.Where(x => x.IsCheckedIn == filterOptions.IsCheckedIn.Value);
            }

            query = query.OrderByDescending(x => x.CheckedInAt).ThenBy(x => x.CheckedInAt);
            var data = await query.ToListAsync();
            var userIds = data.Select(x => x.UserId).ToList();
            var users = await _userContext.Users.Where(x => x.UserType == UserType.Student && userIds.Contains(x.Id))
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.UserName,
                    x.Gender,
                    x.PhoneNumber,
                    x.DateOfBirth
                })
                .ToListAsync();
            var userNames = users.Select(u => u.UserName).ToList();

            var userClass = from u in _vnkContext.Users
                            join d in _vnkContext.Departments on u.DepartmentId equals d.Id
                            join uc in _vnkContext.ClassUsers on u.Id equals uc.UserId
                            join c in _vnkContext.Classes on uc.ClassId equals c.Id
                            where u.UserType == UserType.Student && userNames.Contains(u.UserName)
                            select new
                            {
                                u.UserName,
                                u.ClassCode,
                                DepartmentName = d.Name
                            };

            return new ListResult<object>(data.Select(x =>
            {
                var user = users.First(u => u.Id == x.UserId);
                var classInfo = userClass.FirstOrDefault(c => c.UserName == user.UserName);
                return new
                {
                    x.Id,
                    x.UserId,
                    x.IsCheckedIn,
                    x.CheckedInBy,
                    x.CheckedInAt,
                    user.UserName,
                    user.Name,
                    user.Gender,
                    user.PhoneNumber,
                    user.DateOfBirth,
                    classInfo?.ClassCode,
                    classInfo?.DepartmentName
                };
            }), await query.CountAsync(), filterOptions);
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
                                         IsCheckedIn = userEvent.CheckedInAt.HasValue
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
                                   IsCheckedIn = _dbContext.UserEvents.Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId).Select(x => x.CheckedInAt.HasValue).FirstOrDefault()
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

        var attendee = await (from user in _userContext.Users
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
                CheckedInCount = _dbContext.UserEvents.Count(u => u.EventId == x.Id && u.CheckedInAt != null)
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

    private string GetCurrentUserName()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        return user?.Identity?.Name
            ?? user?.FindFirstValue(ClaimTypes.Name)
            ?? user?.FindFirstValue("preferred_username")
            ?? user?.FindFirstValue("unique_name")
            ?? "system";
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

    private static bool TryParseUserId(string userId, out int userIdValue)
    {
        return int.TryParse(userId, out userIdValue);
    }

    private sealed record EventQrPayload(Guid EventId, string UserId);
}
