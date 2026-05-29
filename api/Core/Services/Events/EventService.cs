using Microsoft.EntityFrameworkCore;
using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Core.Interfaces.IRepositories;
using YouthUnion.Core.Interfaces.IServices;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;
using YouthUnion.Core.Services.Events.Models;
using YouthUnion.Infrastructure.Data;

namespace YouthUnion.Core.Services.Events;

public class EventService(IEventRepository _eventRepository, ApplicationDbContext _context) : IEventService
{
    public Task<THPResult> AddUserAsync(EventUserAddArgs args) => _eventRepository.AddUserAsync(args);

    public Task<THPResult<object>> ScanQrAsync(EventCheckInArgs args) => _eventRepository.ScanQrAsync(args);

    public async Task<THPResult> CreateAsync(EventCreateArgs args)
    {
        var validateResult = await ValidateAcademicYearSemesterAsync(args.AcademicYearId, args.SemesterId);
        if (!validateResult.Succeeded)
        {
            return validateResult;
        }

        await _eventRepository.AddAsync(new Event
        {
            Title = args.Title,
            Description = args.Description,
            Content = args.Content,
            EndDate = args.EndDate,
            StartDate = args.StartDate,
            Thumbnail = args.Thumbnail,
            EventType = args.EventType,
            AcademicYearId = args.AcademicYearId,
            SemesterId = args.SemesterId
        });
        return THPResult.Success;
    }

    public async Task<THPResult> DeleteAsync(Guid id)
    {
        var data = await _eventRepository.FindAsync(id);
        if (data is null) return THPResult.Failed("Không tìm thấy sự kiện!");
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
            data.Thumbnail,
            data.EventType,
            data.AcademicYearId,
            data.SemesterId
        });
    }

    public Task<THPResult<object>> GenerateQrAsync(EventUserQrArgs args) => _eventRepository.GenerateQrAsync(args);

    public Task<ListResult<object>> GetMyEventsAsync(FilterOptions filterOptions) => _eventRepository.GetMyEventsAsync(filterOptions);

    public Task<THPResult<object>> GetMyQrAsync(Guid eventId) => _eventRepository.GetMyQrAsync(eventId);

    public Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions) => _eventRepository.GetUsersAsync(filterOptions);

    public Task<ListResult<object>> ListAsync(EventFilterOptions filterOptions) => _eventRepository.ListAsync(filterOptions);

    public Task<THPResult<EventCheckInExportData>> GetCheckInExportAsync(Guid eventId) => _eventRepository.GetCheckInExportAsync(eventId);

    public Task<THPResult> RemoveUserAsync(EventUserRemoveArgs args) => _eventRepository.RemoveUserAsync(args);

    public async Task<THPResult> UpdateAsync(EventUpdateArgs args)
    {
        var data = await _eventRepository.FindAsync(args.Id);
        if (data is null) return THPResult.Failed("Không tìm thấy sự kiện!");

        var validateResult = await ValidateAcademicYearSemesterAsync(args.AcademicYearId, args.SemesterId);
        if (!validateResult.Succeeded)
        {
            return validateResult;
        }

        data.Title = args.Title;
        data.Description = args.Description;
        data.Content = args.Content;
        data.StartDate = args.StartDate;
        data.EndDate = args.EndDate;
        data.Thumbnail = args.Thumbnail;
        data.EventType = args.EventType;
        data.AcademicYearId = args.AcademicYearId;
        data.SemesterId = args.SemesterId;
        await _eventRepository.UpdateAsync(data);
        return THPResult.Success;
    }

    private async Task<THPResult> ValidateAcademicYearSemesterAsync(int? academicYearId, int? semesterId)
    {
        if (academicYearId.HasValue)
        {
            var ayExists = await _context.AcademicYears.AnyAsync(x => x.Id == academicYearId.Value);
            if (!ayExists)
            {
                return THPResult.Failed("Không tìm thấy năm học");
            }
        }

        if (semesterId.HasValue)
        {
            var semester = await _context.Semesters.AsNoTracking().FirstOrDefaultAsync(x => x.Id == semesterId.Value);
            if (semester is null)
            {
                return THPResult.Failed("Không tìm thấy kỳ học");
            }

            if (!academicYearId.HasValue)
            {
                return THPResult.Failed("Vui lòng chọn năm học khi chọn kỳ học");
            }

            if (semester.AcademicYearId != academicYearId.Value)
            {
                return THPResult.Failed("Kỳ học không thuộc năm học đã chọn");
            }
        }

        return THPResult.Success;
    }
}
