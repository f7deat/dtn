using Microsoft.AspNetCore.Mvc;
using YouthUnion.Foundation;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Filters;

namespace YouthUnion.Controllers;

public class LogController(ILogService _logService) : BaseController
{
    [HttpGet("list")]
    public async Task<IActionResult> ListAsync([FromQuery] LogFilterOptions filterOptions) => Ok(await _logService.ListAsync(filterOptions));
}
