using Microsoft.IdentityModel.Abstractions;
using THPCore.Models;
using YouthUnion.Models.Filters;

namespace YouthUnion.Interfaces.IServices;

public interface ILogService
{
    Task AddAsync(string message, EventLogLevel level = EventLogLevel.LogAlways);
    Task<ListResult> ListAsync(LogFilterOptions filterOptions);
}
