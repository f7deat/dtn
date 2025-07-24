using THPCore.Models;
using YouthUnion.Interfaces.IServices;

namespace YouthUnion.Services;

public class EventService : IEventService
{
    public Task<ListResult<object>> ListAsync(FilterOptions filterOptions)
    {
        throw new NotImplementedException();
    }
}
