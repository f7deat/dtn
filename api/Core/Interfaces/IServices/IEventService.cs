using THPCore.Models;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;
using YouthUnion.Core.Services.Events.Models;

namespace YouthUnion.Core.Interfaces.IServices;

public interface IEventService
{
    Task<THPResult> AddUserAsync(EventUserAddArgs args);
    Task<THPResult<object>> ScanQrAsync(EventCheckInArgs args);
    Task<THPResult> CreateAsync(EventCreateArgs args);
    Task<THPResult> DeleteAsync(Guid id);
    Task<THPResult<object>> DetailAsync(Guid id);
    Task<THPResult<object>> GenerateQrAsync(EventUserQrArgs args);
    Task<ListResult<object>> GetMyEventsAsync(FilterOptions filterOptions);
    Task<THPResult<object>> GetMyQrAsync(Guid eventId);
    Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions);
    Task<ListResult<object>> ListAsync(EventFilterOptions filterOptions);
    Task<THPResult<EventCheckInExportData>> GetCheckInExportAsync(Guid eventId);
    Task<THPResult> RemoveUserAsync(EventUserRemoveArgs args);
    Task<THPResult> UpdateAsync(EventUpdateArgs args);
}
