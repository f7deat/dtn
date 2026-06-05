using Microsoft.IdentityModel.Abstractions;
using THPCore.Interfaces;
using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Infrastructure.Data;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Filters;

namespace YouthUnion.Services;

public class LogService(ApplicationDbContext _context, IHCAService _hcaService) : ILogService
{
    public async Task AddAsync(string message, EventLogLevel level = EventLogLevel.LogAlways)
    {
        await _context.ApplicationLogs.AddAsync(new ApplicationLog
        {
            UserName = _hcaService.GetUserName(),
            CreatedAt = DateTime.Now,
            Message = message,
            LogLevel = level
        });
    }

    public async Task<ListResult> ListAsync(LogFilterOptions filterOptions)
    {
        var query = from l in _context.ApplicationLogs
                    select new
                    {
                        l.Id,
                        l.UserName,
                        l.CreatedAt,
                        l.Message,
                        l.LogLevel
                    };
        if (!string.IsNullOrWhiteSpace(filterOptions.UserName))
        {
            query = query.Where(x => x.UserName.Contains(filterOptions.UserName));
        }
        if (!string.IsNullOrWhiteSpace(filterOptions.Message))
        {
            query = query.Where(x => x.Message.Contains(filterOptions.Message));
        }
        query = query.OrderByDescending(x => x.CreatedAt);
        return await ListResult.Success(query, filterOptions);
    }
}
