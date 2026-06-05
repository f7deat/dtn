using THPCore.Interfaces;
using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;
using YouthUnion.Core.Services.Events.Models;

namespace YouthUnion.Core.Interfaces.IRepositories;

public interface IEventRepository : IAsyncRepository<Event>
{
    Task<THPResult> AddUserAsync(EventUserAddArgs args);
    Task<THPResult<object>> ScanQrAsync(EventCheckInArgs args);
    Task<THPResult<object>> GenerateQrAsync(EventUserQrArgs args);
    Task<ListResult<object>> GetMyEventsAsync(FilterOptions filterOptions);
    Task<THPResult<object>> GetMyQrAsync(Guid eventId);
    Task<THPResult<object>> GetMyAttendanceHistoryAsync(Guid eventId);
    Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions);
    Task<THPResult<EventCheckInExportData>> GetCheckInExportAsync(Guid eventId, DateOnly? attendanceDate = null);
    Task<THPResult<object>> ImportCheckInAsync(Guid eventId, IReadOnlyList<EventCheckInImportItem> items);
    Task<ListResult<object>> ListAsync(EventFilterOptions filterOptions);
    Task<THPResult> RemoveUserAsync(EventUserRemoveArgs args);
    Task<bool> HasAnyRegistrationAsync(Guid id);
}
