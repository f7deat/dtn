using THPCore.Interfaces;
using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;

namespace YouthUnion.Core.Interfaces.IRepositories;

public interface IEventRepository : IAsyncRepository<Event>
{
    Task<THPResult> AddUserAsync(EventUserAddArgs args);
    Task<THPResult<object>> CheckInAsync(EventCheckInArgs args);
    Task<THPResult<object>> GenerateQrAsync(EventUserQrArgs args);
    Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions);
    Task<ListResult<object>> ListAsync(EventFilterOptions filterOptions);
    Task<THPResult> RemoveUserAsync(EventUserRemoveArgs args);
}
