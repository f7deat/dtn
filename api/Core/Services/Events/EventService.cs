using Microsoft.EntityFrameworkCore;
using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Core.Interfaces.IRepositories;
using YouthUnion.Core.Interfaces.IServices;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;
using YouthUnion.Core.Services.Events.Models;
using YouthUnion.Infrastructure.Data;
using YouthUnion.Interfaces.IServices;

namespace YouthUnion.Core.Services.Events;

public class EventService(IEventRepository _eventRepository, ApplicationDbContext _context, ILogService _logService) : IEventService
{
    public Task<THPResult> AddUserAsync(EventUserAddArgs args) => _eventRepository.AddUserAsync(args);

    public Task<THPResult<object>> ScanQrAsync(EventCheckInArgs args) => _eventRepository.ScanQrAsync(args);

    public async Task<THPResult> CreateAsync(EventCreateArgs args)
    {
        var validateDaysResult = ValidateNumberOfDays(args.NumberOfDays);
        if (!validateDaysResult.Succeeded)
        {
            return validateDaysResult;
        }

        var validateResult = await ValidateSemesterAsync(args.SemesterId);
        if (!validateResult.Succeeded)
        {
            return validateResult;
        }
        await _logService.AddAsync($"Tạo sự kiện: {args.Title}");
        await _eventRepository.AddAsync(new Event
        {
            Title = args.Title,
            Description = args.Description,
            Content = args.Content,
            EndDate = args.EndDate,
            StartDate = args.StartDate,
            NumberOfDays = args.NumberOfDays,
            Thumbnail = args.Thumbnail,
            EventType = args.EventType,
            SemesterId = args.SemesterId
        });
        return THPResult.Success;
    }

    public async Task<THPResult> DeleteAsync(Guid id)
    {
        var data = await _eventRepository.FindAsync(id);
        if (data is null) return THPResult.Failed("Không tìm thấy sự kiện!");
        if (await _eventRepository.HasAnyRegistrationAsync(id))
        {
            return THPResult.Failed("Không thể xóa sự kiện vì đã có người đăng ký tham gia");
        }
        await _logService.AddAsync($"Xóa sự kiện: {data.Title}");
        await _eventRepository.DeleteAsync(data);
        return THPResult.Success;
    }

    public async Task<THPResult<object>> DetailAsync(Guid id)
    {
        var data = await _eventRepository.FindAsync(id);
        if (data is null) return THPResult<object>.Failed("Không tìm thấy sự kiện!");
        return THPResult<object>.Ok(new
        {
            data.Id,
            data.Title,
            data.Description,
            data.Content,
            data.StartDate,
            data.EndDate,
            data.NumberOfDays,
            data.Thumbnail,
            data.EventType,
            data.SemesterId
        });
    }

    public Task<THPResult<object>> GenerateQrAsync(EventUserQrArgs args) => _eventRepository.GenerateQrAsync(args);

    public Task<ListResult<object>> GetMyEventsAsync(FilterOptions filterOptions) => _eventRepository.GetMyEventsAsync(filterOptions);

    public Task<THPResult<object>> GetMyQrAsync(Guid eventId) => _eventRepository.GetMyQrAsync(eventId);

    public Task<THPResult<object>> GetMyAttendanceHistoryAsync(Guid eventId) => _eventRepository.GetMyAttendanceHistoryAsync(eventId);

    public Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions) => _eventRepository.GetUsersAsync(filterOptions);

    public Task<ListResult<object>> ListAsync(EventFilterOptions filterOptions) => _eventRepository.ListAsync(filterOptions);

    public Task<THPResult<EventCheckInExportData>> GetCheckInExportAsync(Guid eventId, DateOnly? attendanceDate = null)
        => _eventRepository.GetCheckInExportAsync(eventId, attendanceDate);

    public Task<THPResult<object>> ImportCheckInAsync(Guid eventId, IReadOnlyList<EventCheckInImportItem> items)
        => _eventRepository.ImportCheckInAsync(eventId, items);

    public Task<THPResult> RemoveUserAsync(EventUserRemoveArgs args) => _eventRepository.RemoveUserAsync(args);

    public async Task<THPResult> UpdateAsync(EventUpdateArgs args)
    {
        var data = await _eventRepository.FindAsync(args.Id);
        if (data is null) return THPResult.Failed("Không tìm thấy sự kiện!");

        var validateDaysResult = ValidateNumberOfDays(args.NumberOfDays);
        if (!validateDaysResult.Succeeded)
        {
            return validateDaysResult;
        }

        var validateResult = await ValidateSemesterAsync(args.SemesterId);
        if (!validateResult.Succeeded)
        {
            return validateResult;
        }

        data.Title = args.Title;
        data.Description = args.Description;
        data.Content = args.Content;
        data.StartDate = args.StartDate;
        data.EndDate = args.EndDate;
        data.NumberOfDays = args.NumberOfDays;
        data.Thumbnail = args.Thumbnail;
        data.EventType = args.EventType;
        data.SemesterId = args.SemesterId;
        await _logService.AddAsync($"Cập nhật sự kiện: {data.Title}");
        await _eventRepository.UpdateAsync(data);
        return THPResult.Success;
    }

    private async Task<THPResult> ValidateSemesterAsync(int? semesterId)
    {
        if (semesterId.HasValue)
        {
            var semesterExists = await _context.Semesters.AsNoTracking().AnyAsync(x => x.Id == semesterId.Value);
            if (!semesterExists)
            {
                return THPResult.Failed("Không tìm thấy kỳ học");
            }
        }

        return THPResult.Success;
    }

    private static THPResult ValidateNumberOfDays(int numberOfDays)
    {
        if (numberOfDays <= 0)
        {
            return THPResult.Failed("Số ngày phải lớn hơn 0");
        }

        if (numberOfDays > 365)
        {
            return THPResult.Failed("Số ngày không được vượt quá 365");
        }

        return THPResult.Success;
    }
}
