using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Core.Interfaces.IRepositories;
using YouthUnion.Core.Interfaces.IServices;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;

namespace YouthUnion.Core.Services.Events;

public class EventService(IEventRepository _eventRepository) : IEventService
{
    public Task<THPResult> AddUserAsync(EventUserAddArgs args)
    {
        throw new NotImplementedException();
    }

    public async Task<THPResult> CreateAsync(EventCreateArgs args)
    {
        await _eventRepository.AddAsync(new Event
        {
            Title = args.Title,
            Description = args.Description,
            Content = args.Content,
            EndDate = args.EndDate,
            StartDate = args.StartDate
        });
        return THPResult.Success;
    }

    public async Task<THPResult> DeleteAsync(Guid id)
    {
        var data = await _eventRepository.FindAsync(id);
        if (data is null) return THPResult.Failed("Không tìm thấy sự kiện!");
        await _eventRepository.DeleteAsync(data);
        return THPResult.Success;
    }

    public async Task<THPResult<object>> DetailAsync(Guid id)
    {
        var data = await _eventRepository.FindAsync(id);
        if (data is null) return THPResult<object>.Failed("Không tìm thấy sự kiện!");
        return THPResult<object>.Ok(new
        {
            data.Id,
            data.Title,
            data.Description,
            data.Content,
            data.StartDate,
            data.EndDate
        });
    }

    public Task<ListResult<object>> GetUsersAsync(EUFilterOptions filterOptions) => _eventRepository.GetUsersAsync(filterOptions);

    public Task<ListResult<object>> ListAsync(FilterOptions filterOptions) => _eventRepository.ListAsync(filterOptions);

    public Task<THPResult> RemoveUserAsync(EventUserRemoveArgs args) => _eventRepository.RemoveUserAsync(args);

    public async Task<THPResult> UpdateAsync(EventUpdateArgs args)
    {
        var data = await _eventRepository.FindAsync(args.Id);
        if (data is null) return THPResult.Failed("Không tìm thấy sự kiện!");
        data.Title = args.Title;
        data.Description = args.Description;
        data.Content = args.Content;
        data.StartDate = args.StartDate;
        data.EndDate = args.EndDate;
        await _eventRepository.UpdateAsync(data);
        return THPResult.Success;
    }
}
