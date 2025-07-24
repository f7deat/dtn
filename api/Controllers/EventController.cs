using Microsoft.AspNetCore.Mvc;
using THPCore.Models;
using YouthUnion.Foundation;
using YouthUnion.Interfaces.IServices;

namespace YouthUnion.Controllers;

public class EventController(IEventService _eventService) : BaseController
{
    [HttpGet("list")]
    public async Task<IActionResult> ListAsync([FromQuery] FilterOptions filterOptions) => Ok(await _eventService.ListAsync(filterOptions));
}
