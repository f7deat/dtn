using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Core.Interfaces.IRepositories;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;
using YouthUnion.Infrastructure.Data;

namespace YouthUnion.Infrastructure.Repositories;

public class EventRepository(ApplicationDbContext context) : EfRepository<Event>(context), IEventRepository
{
    public Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions)
    {
        throw new NotImplementedException();
    }

    public Task<ListResult<object>> ListAsync(FilterOptions filterOptions)
    {
        throw new NotImplementedException();
    }

    public Task<THPResult> RemoveUserAsync(EventUserRemoveArgs args)
    {
        throw new NotImplementedException();
    }
}
