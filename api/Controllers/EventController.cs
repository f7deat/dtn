using Microsoft.AspNetCore.Mvc;
using THPCore.Models;
using YouthUnion.Core.Interfaces.IServices;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;
using YouthUnion.Foundation;

namespace YouthUnion.API.Controllers;

public class EventController(IEventService _eventService) : BaseController
{
    [HttpGet("list")]
    public async Task<IActionResult> ListAsync([FromQuery] EventFilterOptions filterOptions) => Ok(await _eventService.ListAsync(filterOptions));

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] EventCreateArgs args) => Ok(await _eventService.CreateAsync(args));

    [HttpPut]
    public async Task<IActionResult> UpdateAsync([FromBody] EventUpdateArgs args) => Ok(await _eventService.UpdateAsync(args));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAsync([FromRoute] Guid id) => Ok(await _eventService.DetailAsync(id));

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync([FromRoute] Guid id) => Ok(await _eventService.DeleteAsync(id));

    [HttpGet("users")]
    public async Task<IActionResult> GetUsersAsync([FromQuery] EUFilterOptions filterOptions) => Ok(await _eventService.GetUsersAsync(filterOptions));

    [HttpGet("my-events")]
    public async Task<IActionResult> GetMyEventsAsync([FromQuery] FilterOptions filterOptions) => Ok(await _eventService.GetMyEventsAsync(filterOptions));

    [HttpPost("add-user")]
    public async Task<IActionResult> AddUserAsync([FromBody] EventUserAddArgs args) => Ok(await _eventService.AddUserAsync(args));

    [HttpPost("remove-user")]
    public async Task<IActionResult> RemoveUserAsync([FromBody] EventUserRemoveArgs args) => Ok(await _eventService.RemoveUserAsync(args));

    [HttpPost("qr")]
    public async Task<IActionResult> GenerateQrAsync([FromBody] EventUserQrArgs args) => Ok(await _eventService.GenerateQrAsync(args));

    [HttpPost("check-in")]
    public async Task<IActionResult> CheckInAsync([FromBody] EventCheckInArgs args) => Ok(await _eventService.CheckInAsync(args));

    [HttpGet("my-qr/{eventId}")]
    public async Task<IActionResult> GetMyQrAsync([FromRoute] Guid eventId) => Ok(await _eventService.GetMyQrAsync(eventId));
}
