using Microsoft.AspNetCore.Mvc;
using YouthUnion.Foundation;
using YouthUnion.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace YouthUnion.Controllers;

[Route("academic-year")]
public class AcademicYearController(ApplicationDbContext _context) : BaseController
{
    [HttpGet("options")]
    public async Task<IActionResult> GetOptionsAsync()
    {
        var options = await _context.AcademicYears.OrderByDescending(x => x.StartDate).Select(x => new
        {
            Value = x.Id,
            Label = x.Name,
            StartDate = x.StartDate,
            EndDate = x.EndDate
        }).ToListAsync();
        return Ok(options);
    }
}
