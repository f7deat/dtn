using THPCore.Interfaces;
using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;

namespace YouthUnion.Core.Interfaces.IRepositories;

public interface IEventRepository : IAsyncRepository<Event>
{
    Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions);
    Task<ListResult<object>> ListAsync(FilterOptions filterOptions);
    Task<THPResult> RemoveUserAsync(EventUserRemoveArgs args);
}
