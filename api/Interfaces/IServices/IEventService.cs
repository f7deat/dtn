using THPCore.Models;

namespace YouthUnion.Interfaces.IServices;

public interface IEventService
{
    Task<ListResult<object>> ListAsync(FilterOptions filterOptions);
}
