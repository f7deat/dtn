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

    public async Task<THPResult<EventCheckInExportData>> GetCheckInExportAsync(Guid eventId, DateOnly? attendanceDate = null)
    {
        var eventItem = await _dbContext.Events.AsNoTracking().FirstOrDefaultAsync(x => x.Id == eventId);
        if (eventItem is null)
        {
            return THPResult<EventCheckInExportData>.Failed("Không tìm thấy sự kiện!");
        }

        var query = from ue in _dbContext.UserEvents.AsNoTracking()
                    join u in _dbContext.Users.AsNoTracking() on ue.UserId equals u.Id into userGroup
                    from user in userGroup.DefaultIfEmpty()
                    join a in _dbContext.UserEventAttendances.AsNoTracking()
                        on new { ue.EventId, ue.UserId } equals new { a.EventId, a.UserId }
                    join d in _dbContext.Departments on user.DepartmentId equals d.Id into deptGroup
                    from dept in deptGroup.DefaultIfEmpty()
                    where ue.EventId == eventId
                    select new
                    {
                        ue.UserId,
                        user.UserName,
                        Name = user.Name,
                        user.Gender,
                        user.PhoneNumber,
                        user.DateOfBirth,
                        DepartmentName = dept.Name,
                        a.AttendanceDate,
                        a.CheckedInAt,
                        a.CheckedInBy,
                        a.CheckedOutAt,
                        a.CheckedOutBy
                    };

        if (attendanceDate.HasValue)
        {
            query = query.Where(x => x.AttendanceDate == attendanceDate.Value);
        }

        var items = await query
            .OrderByDescending(x => x.AttendanceDate)
            .ThenByDescending(x => x.CheckedInAt)
            .Select(x => new EventCheckInExportItem(
                x.UserId,
                x.UserName,
                x.Name,
                x.Gender,
                x.PhoneNumber,
                x.DateOfBirth,
                x.DepartmentName,
                x.AttendanceDate,
                x.CheckedInAt,
                x.CheckedInBy,
                x.CheckedOutAt,
                x.CheckedOutBy))
            .ToListAsync();

        return THPResult<EventCheckInExportData>.Ok(new EventCheckInExportData(
            eventItem.Title,
            eventItem.StartDate,
            eventItem.EndDate,
            items));
    }

    public async Task<THPResult<object>> ImportCheckInAsync(Guid eventId, IReadOnlyList<EventCheckInImportItem> items)
    {
        var eventItem = await _dbContext.Events.FirstOrDefaultAsync(x => x.Id == eventId);
        if (eventItem is null)
        {
            return THPResult<object>.Failed("Không tìm thấy sự kiện!");
        }

        if (items.Count == 0)
        {
            return THPResult<object>.Failed("File import không có dữ liệu hợp lệ.");
        }

        var importCount = 0;
        var skippedCount = 0;
        var warningMessages = new List<string>();
        var touchedUsers = new HashSet<string>();
        var operatorUserName = _hcaService.GetUserName();

        foreach (var item in items)
        {
            if (string.IsNullOrWhiteSpace(item.UserName))
            {
                skippedCount++;
                continue;
            }

            if (item.AttendanceDate < eventItem.StartDate || item.AttendanceDate > eventItem.EndDate)
            {
                skippedCount++;
                warningMessages.Add($"{item.UserName}: ngày {item.AttendanceDate:dd/MM/yyyy} ngoài phạm vi sự kiện.");
                continue;
            }

            var normalizedUserName = item.UserName.Trim();
            var user = await _userManager.Users.FirstOrDefaultAsync(x => x.UserName == normalizedUserName);
            if (user is null)
            {
                var addResult = await AddUserAsync(new EventUserAddArgs
                {
                    EventId = eventId,
                    UserName = normalizedUserName
                });

                if (!addResult.Succeeded && addResult.Message != "Người dùng này đã có trong sự kiện!")
                {
                    skippedCount++;
                    warningMessages.Add($"{normalizedUserName}: {addResult.Message}");
                    continue;
                }

                user = await _userManager.Users.FirstOrDefaultAsync(x => x.UserName == normalizedUserName);
                if (user is null)
                {
                    skippedCount++;
                    warningMessages.Add($"{normalizedUserName}: không tìm thấy người dùng.");
                    continue;
                }
            }

            var userEvent = await _dbContext.UserEvents.FirstOrDefaultAsync(x => x.EventId == eventId && x.UserId == user.Id);
            if (userEvent is null)
            {
                userEvent = new UserEvent
                {
                    EventId = eventId,
                    UserId = user.Id
                };
                await _dbContext.UserEvents.AddAsync(userEvent);
            }

            var attendance = await _dbContext.UserEventAttendances.FirstOrDefaultAsync(x =>
                x.EventId == eventId &&
                x.UserId == user.Id &&
                x.AttendanceDate == item.AttendanceDate);

            if (attendance is null)
            {
                attendance = new UserEventAttendance
                {
                    EventId = eventId,
                    UserId = user.Id,
                    AttendanceDate = item.AttendanceDate
                };
                await _dbContext.UserEventAttendances.AddAsync(attendance);
            }

            attendance.CheckedInAt = item.CheckedInAt;
            attendance.CheckedInBy = item.CheckedInAt.HasValue ? (item.CheckedInBy ?? operatorUserName) : null;
            attendance.CheckedOutAt = item.CheckedOutAt;
            attendance.CheckedOutBy = item.CheckedOutAt.HasValue ? (item.CheckedOutBy ?? operatorUserName) : null;

            touchedUsers.Add(user.Id);
            importCount++;
        }

        await _dbContext.SaveChangesAsync();

        foreach (var userId in touchedUsers)
        {
            var userEvent = await _dbContext.UserEvents.FirstOrDefaultAsync(x => x.EventId == eventId && x.UserId == userId);
            if (userEvent is null)
            {
                continue;
            }

            var latestCheckIn = await _dbContext.UserEventAttendances
                .Where(x => x.EventId == eventId && x.UserId == userId && x.CheckedInAt.HasValue)
                .OrderByDescending(x => x.CheckedInAt)
                .FirstOrDefaultAsync();

            var latestCheckOut = await _dbContext.UserEventAttendances
                .Where(x => x.EventId == eventId && x.UserId == userId && x.CheckedOutAt.HasValue)
                .OrderByDescending(x => x.CheckedOutAt)
                .FirstOrDefaultAsync();

            userEvent.CheckedInAt = latestCheckIn?.CheckedInAt;
            userEvent.CheckedInBy = latestCheckIn?.CheckedInBy;
            userEvent.CheckedOutAt = latestCheckOut?.CheckedOutAt;
            userEvent.CheckedOutBy = latestCheckOut?.CheckedOutBy;
        }

        if (touchedUsers.Count > 0)
        {
            await _dbContext.SaveChangesAsync();
        }

        return THPResult<object>.Ok(new
        {
            Imported = importCount,
            Skipped = skippedCount,
            Warnings = warningMessages.Take(20).ToList()
        });
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
        var attendanceDate = args.AttendanceDate ?? DateOnly.FromDateTime(now);

        if (attendanceDate < eventItem.StartDate || attendanceDate > eventItem.EndDate)
        {
            return THPResult<object>.Failed($"Ngày điểm danh {attendanceDate:dd/MM/yyyy} không nằm trong thời gian sự kiện.");
        }

        var userAttendance = await _dbContext.UserEventAttendances.FirstOrDefaultAsync(x =>
            x.EventId == payload.EventId &&
            x.UserId == payload.UserId &&
            x.AttendanceDate == attendanceDate);

        if (scanAction == ScanAction.CheckIn)
        {
            if (userAttendance?.CheckedInAt.HasValue == true)
            {
                return THPResult<object>.Failed($"Người tham gia đã check-in ngày {attendanceDate:dd/MM/yyyy} lúc {userAttendance.CheckedInAt:HH:mm}.");
            }

            userAttendance ??= new UserEventAttendance
            {
                EventId = payload.EventId,
                UserId = payload.UserId,
                AttendanceDate = attendanceDate
            };

            userAttendance.CheckedInAt = now;
            userAttendance.CheckedInBy = operatorUserName;

            if (_dbContext.Entry(userAttendance).State == EntityState.Detached)
            {
                await _dbContext.UserEventAttendances.AddAsync(userAttendance);
            }
        }
        else
        {
            if (userAttendance?.CheckedInAt.HasValue != true)
            {
                return THPResult<object>.Failed($"Người tham gia chưa check-in ngày {attendanceDate:dd/MM/yyyy} nên chưa thể checkout.");
            }

            if (userAttendance.CheckedOutAt.HasValue)
            {
                return THPResult<object>.Failed($"Người tham gia đã checkout ngày {attendanceDate:dd/MM/yyyy} lúc {userAttendance.CheckedOutAt:HH:mm}.");
            }

            userAttendance.CheckedOutAt = now;
            userAttendance.CheckedOutBy = operatorUserName;
        }

        // Keep legacy aggregate fields in sync for existing screens.
        if (userAttendance?.CheckedInAt.HasValue == true &&
            (!userEvent.CheckedInAt.HasValue || userEvent.CheckedInAt.Value < userAttendance.CheckedInAt.Value))
        {
            userEvent.CheckedInAt = userAttendance.CheckedInAt;
            userEvent.CheckedInBy = userAttendance.CheckedInBy;
        }

        if (userAttendance?.CheckedOutAt.HasValue == true &&
            (!userEvent.CheckedOutAt.HasValue || userEvent.CheckedOutAt.Value < userAttendance.CheckedOutAt.Value))
        {
            userEvent.CheckedOutAt = userAttendance.CheckedOutAt;
            userEvent.CheckedOutBy = userAttendance.CheckedOutBy;
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
            AttendanceDate = userAttendance?.AttendanceDate,
            Action = scanAction == ScanAction.CheckIn ? "check-in" : "check-out",
            CheckedInAt = userAttendance?.CheckedInAt,
            CheckedInBy = userAttendance?.CheckedInBy,
            CheckedOutAt = userAttendance?.CheckedOutAt,
            CheckedOutBy = userAttendance?.CheckedOutBy,
            IsCheckedIn = userAttendance?.CheckedInAt.HasValue == true,
            IsCheckedOut = userAttendance?.CheckedOutAt.HasValue == true
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
            var attendanceDate = filterOptions.AttendanceDate ?? DateOnly.FromDateTime(DateTime.Now);

            var query = from userEvent in _context.UserEvents.AsNoTracking()
                        join user in _context.Users on userEvent.UserId equals user.Id
                        join eventAttendance in _context.UserEventAttendances.Where(x => x.AttendanceDate == attendanceDate)
                            on new { userEvent.EventId, userEvent.UserId } equals new { eventAttendance.EventId, eventAttendance.UserId } into attendanceGroup
                        from attendance in attendanceGroup.DefaultIfEmpty()
                        join dept in _context.Departments on user.DepartmentId equals dept.Id into deptGroup
                        from department in deptGroup.DefaultIfEmpty()
                        where userEvent.EventId == filterOptions.EventId.Value
                        select new
                        {
                            Id = userEvent.UserId,
                            userEvent.UserId,
                            CheckedInAt = attendance.CheckedInAt,
                            CheckedInBy = attendance.CheckedInBy,
                            CheckedOutAt = attendance.CheckedOutAt,
                            CheckedOutBy = attendance.CheckedOutBy,
                            AttendanceDate = attendanceDate,
                            IsCheckedIn = attendance.CheckedInAt.HasValue,
                            IsCheckedOut = attendance.CheckedOutAt.HasValue,
                            AttendanceStatus = attendance.CheckedOutAt.HasValue ? "checked-out" : attendance.CheckedInAt.HasValue ? "checked-in" : "not-checked-in",
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
                                         CheckedInAt = _dbContext.UserEventAttendances
                                             .Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId && x.CheckedInAt.HasValue)
                                             .Max(x => x.CheckedInAt),
                                         CheckedInBy = _dbContext.UserEventAttendances
                                             .Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId)
                                             .OrderByDescending(x => x.AttendanceDate)
                                             .ThenByDescending(x => x.CheckedInAt)
                                             .Select(x => x.CheckedInBy)
                                             .FirstOrDefault(),
                                         CheckedOutAt = _dbContext.UserEventAttendances
                                             .Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId && x.CheckedOutAt.HasValue)
                                             .Max(x => x.CheckedOutAt),
                                         CheckedOutBy = _dbContext.UserEventAttendances
                                             .Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId)
                                             .OrderByDescending(x => x.AttendanceDate)
                                             .ThenByDescending(x => x.CheckedOutAt)
                                             .Select(x => x.CheckedOutBy)
                                             .FirstOrDefault(),
                                         IsCheckedIn = _dbContext.UserEventAttendances.Any(x => x.EventId == eventItem.Id && x.UserId == currentUserId && x.CheckedInAt.HasValue),
                                         IsCheckedOut = _dbContext.UserEventAttendances.Any(x => x.EventId == eventItem.Id && x.UserId == currentUserId && x.CheckedOutAt.HasValue)
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
                                   CheckedInAt = _dbContext.UserEventAttendances
                                       .Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId && x.CheckedInAt.HasValue)
                                       .Max(x => x.CheckedInAt),
                                   CheckedInBy = _dbContext.UserEventAttendances
                                       .Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId)
                                       .OrderByDescending(x => x.AttendanceDate)
                                       .ThenByDescending(x => x.CheckedInAt)
                                       .Select(x => x.CheckedInBy)
                                       .FirstOrDefault(),
                                   CheckedOutAt = _dbContext.UserEventAttendances
                                       .Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId && x.CheckedOutAt.HasValue)
                                       .Max(x => x.CheckedOutAt),
                                   CheckedOutBy = _dbContext.UserEventAttendances
                                       .Where(x => x.EventId == eventItem.Id && x.UserId == currentUserId)
                                       .OrderByDescending(x => x.AttendanceDate)
                                       .ThenByDescending(x => x.CheckedOutAt)
                                       .Select(x => x.CheckedOutBy)
                                       .FirstOrDefault(),
                                   IsCheckedIn = _dbContext.UserEventAttendances.Any(x => x.EventId == eventItem.Id && x.UserId == currentUserId && x.CheckedInAt.HasValue),
                                   IsCheckedOut = _dbContext.UserEventAttendances.Any(x => x.EventId == eventItem.Id && x.UserId == currentUserId && x.CheckedOutAt.HasValue)
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

    public async Task<THPResult<object>> GetMyAttendanceHistoryAsync(Guid eventId)
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

        if (eventItem.EventType == EventType.Limited)
        {
            var userEvent = await _dbContext.UserEvents.AsNoTracking().AnyAsync(x => x.EventId == eventId && x.UserId == currentUserId);
            if (!userEvent)
            {
                return THPResult<object>.Failed("Bạn không có trong danh sách tham gia sự kiện này!");
            }
        }

        var items = await _dbContext.UserEventAttendances.AsNoTracking()
            .Where(x => x.EventId == eventId && x.UserId == currentUserId)
            .OrderByDescending(x => x.AttendanceDate)
            .ThenByDescending(x => x.CheckedInAt)
            .Select(x => new
            {
                x.AttendanceDate,
                x.CheckedInAt,
                x.CheckedInBy,
                x.CheckedOutAt,
                x.CheckedOutBy,
                AttendanceStatus = x.CheckedOutAt.HasValue ? "checked-out" : x.CheckedInAt.HasValue ? "checked-in" : "not-checked-in"
            })
            .ToListAsync();

        return THPResult<object>.Ok(items);
    }

    public async Task<ListResult<object>> ListAsync(EventFilterOptions filterOptions)
    {
        try
        {
            var query = from e in _dbContext.Events.AsNoTracking()
                        join s in _dbContext.Semesters on e.SemesterId equals s.Id into sGroup
                        from semester in sGroup.DefaultIfEmpty()
                        select new
                        {
                            e.Id,
                            e.Title,
                            e.Description,
                            e.StartDate,
                            e.EndDate,
                            e.NumberOfDays,
                            e.Thumbnail,
                            e.EventType,
                            RegistrationCount = _dbContext.UserEvents.Count(u => u.EventId == e.Id),
                            CheckedInCount = _dbContext.UserEventAttendances
                                .Where(u => u.EventId == e.Id && u.CheckedInAt != null)
                                .Select(u => u.UserId)
                                .Distinct()
                                .Count(),
                            CheckedOutCount = _dbContext.UserEventAttendances
                                .Where(u => u.EventId == e.Id && u.CheckedOutAt != null)
                                .Select(u => u.UserId)
                                .Distinct()
                                .Count(),
                            AcademicYearId = semester != null ? (int?)semester.AcademicYearId : null,
                            e.SemesterId,
                            SemesterName = semester != null ? semester.Name : null,
                        };

            if (!string.IsNullOrWhiteSpace(filterOptions.Title))
            {
                var keyword = filterOptions.Title.Trim().ToLower();
                query = query.Where(x => x.Title.ToLower().Contains(keyword));
            }

            if (filterOptions.SemesterId.HasValue)
            {
                query = query.Where(x => x.SemesterId == filterOptions.SemesterId.Value);
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

        var attendanceItems = await _dbContext.UserEventAttendances
            .Where(x => x.EventId == args.EventId && x.UserId == args.UserId)
            .ToListAsync();

        if (attendanceItems.Count > 0)
        {
            _dbContext.UserEventAttendances.RemoveRange(attendanceItems);
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
