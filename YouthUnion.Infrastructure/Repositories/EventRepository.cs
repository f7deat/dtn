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
using YouthUnion.Infrastructure.Data;
using VnkCore.Data;

namespace YouthUnion.Infrastructure.Repositories;

public class EventRepository(
    ApplicationDbContext context,
    VnkDbContext vnkContext,
    IConfiguration configuration,
    IHttpContextAccessor httpContextAccessor) : EfRepository<Event>(context), IEventRepository
{
    private readonly ApplicationDbContext _dbContext = context;
    private readonly VnkDbContext _vnkContext = vnkContext;
    private readonly IConfiguration _configuration = configuration;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public async Task<THPResult> AddUserAsync(EventUserAddArgs args)
    {
        var eventExists = await _dbContext.Events.AnyAsync(x => x.Id == args.EventId);
        if (!eventExists)
        {
            return THPResult.Failed("Không tìm thấy sự kiện!");
        }

        if (!TryParseUserId(args.UserId, out var userIdValue))
        {
            return THPResult.Failed("Mã người tham gia không hợp lệ!");
        }

        var userExists = await _vnkContext.Users.AnyAsync(x => x.Id == userIdValue);
        if (!userExists)
        {
            return THPResult.Failed("Không tìm thấy người tham gia!");
        }

        var registrationExists = await _dbContext.UserEvents.AnyAsync(x => x.EventId == args.EventId && x.UserId == args.UserId);
        if (registrationExists)
        {
            return THPResult.Failed("Người dùng này đã có trong sự kiện!");
        }

        await _dbContext.UserEvents.AddAsync(new UserEvent
        {
            EventId = args.EventId,
            UserId = args.UserId
        });
        await _dbContext.SaveChangesAsync();
        return THPResult.Success;
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

        var userEvent = await _dbContext.UserEvents.FirstOrDefaultAsync(x => x.EventId == payload.EventId && x.UserId == payload.UserId);
        if (userEvent is null)
        {
            return THPResult<object>.Failed("Người tham gia chưa được thêm vào sự kiện!");
        }

        if (userEvent.CheckedInAt.HasValue)
        {
            return THPResult<object>.Failed($"Người tham gia đã check-in lúc {userEvent.CheckedInAt:HH:mm dd/MM/yyyy}.");
        }

        userEvent.CheckedInAt = DateTime.Now;
        userEvent.CheckedInBy = GetCurrentUserName();
        await _dbContext.SaveChangesAsync();

        if (!TryParseUserId(payload.UserId, out var checkedInUserId))
        {
            return THPResult<object>.Failed("Mã người tham gia không hợp lệ!");
        }

        var attendee = await (from user in _vnkContext.Users
                              join detail in _vnkContext.UserDetails on user.Id equals detail.UserId into userDetails
                              from detail in userDetails.DefaultIfEmpty()
                              where user.Id == checkedInUserId
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

        if (!TryParseUserId(args.UserId, out var userIdValue))
        {
            return THPResult<object>.Failed("Mã người tham gia không hợp lệ!");
        }

        var attendee = await (from user in _vnkContext.Users
                              where user.Id == userIdValue
                              select new
                              {
                                  user.Id,
                                  user.UserName,
                                  FullName = user.FirstName + " " + user.LastName
                              }).FirstOrDefaultAsync();

        if (attendee is null)
        {
            return THPResult<object>.Failed("Không tìm thấy người tham gia!");
        }

        return THPResult<object>.Ok(new
        {
            args.EventId,
            attendee.Id,
            attendee.UserName,
            attendee.FullName,
            QrCode = BuildQrCode(args.EventId, args.UserId)
        });
    }

    public async Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions)
    {
        if (!filterOptions.EventId.HasValue)
        {
            return await ListResult<object>.Success(Enumerable.Empty<object>().AsQueryable(), filterOptions);
        }

        var query = from userEvent in _context.UserEvents.AsNoTracking()
                    join user in _vnkContext.Users on userEvent.UserId equals user.Id.ToString()
                    join detail in _vnkContext.UserDetails on user.Id equals detail.UserId into userDetails
                    from detail in userDetails.DefaultIfEmpty()
                    join department in _vnkContext.Departments on user.DepartmentId equals department.Id into departments
                    from department in departments.DefaultIfEmpty()
                    where userEvent.EventId == filterOptions.EventId.Value
                    select new
                    {
                        Id = userEvent.UserId,
                        UserId = userEvent.UserId,
                        user.UserName,
                        FullName = user.FirstName + " " + user.LastName,
                        user.ClassCode,
                        user.ClassName,
                        DepartmentName = department != null ? department.Name : null,
                        userEvent.CheckedInAt,
                        userEvent.CheckedInBy,
                        IsCheckedIn = userEvent.CheckedInAt.HasValue
                    };

        if (!string.IsNullOrWhiteSpace(filterOptions.UserName))
        {
            var keyword = filterOptions.UserName.Trim().ToLower();
            query = query.Where(x => x.UserName.ToLower().Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(filterOptions.FullName))
        {
            var keyword = filterOptions.FullName.Trim().ToLower();
            query = query.Where(x => x.FullName.ToLower().Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(filterOptions.ClassCode))
        {
            var keyword = filterOptions.ClassCode.Trim().ToLower();
            query = query.Where(x => x.ClassCode != null && x.ClassCode.ToLower().Contains(keyword));
        }

        if (filterOptions.IsCheckedIn.HasValue)
        {
            query = query.Where(x => x.IsCheckedIn == filterOptions.IsCheckedIn.Value);
        }

        query = query.OrderByDescending(x => x.CheckedInAt).ThenBy(x => x.FullName);

        return await ListResult<object>.Success(query.Select(x => (object)x), filterOptions);
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
