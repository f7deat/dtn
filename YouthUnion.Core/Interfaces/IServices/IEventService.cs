using THPCore.Models;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;

namespace YouthUnion.Core.Interfaces.IServices;

public interface IEventService
{
    Task<THPResult> AddUserAsync(EventUserAddArgs args);
    Task<THPResult<object>> CheckInAsync(EventCheckInArgs args);
    Task<THPResult> CreateAsync(EventCreateArgs args);
    Task<THPResult> DeleteAsync(Guid id);
    Task<THPResult<object>> DetailAsync(Guid id);
    Task<THPResult<object>> GenerateQrAsync(EventUserQrArgs args);
    Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions);
    Task<ListResult<object>> ListAsync(EventFilterOptions filterOptions);
    Task<THPResult> RemoveUserAsync(EventUserRemoveArgs args);
    Task<THPResult> UpdateAsync(EventUpdateArgs args);
}
