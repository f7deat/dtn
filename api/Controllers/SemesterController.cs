using Microsoft.AspNetCore.Mvc;
using YouthUnion.Foundation;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Semesters;

namespace YouthUnion.Controllers;

[Route("semester")]
public class SemesterController(ISemesterService _semesterService) : BaseController
{
    [HttpGet("list")]
    public async Task<IActionResult> ListAsync([FromQuery] SemesterFilterOptions filterOptions) => Ok(await _semesterService.ListAsync(filterOptions));

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] SemesterCreateRequest request) => Ok(await _semesterService.CreateAsync(request));

    [HttpPut]
    public async Task<IActionResult> UpdateAsync([FromBody] SemesterUpdateRequest request) => Ok(await _semesterService.UpdateAsync(request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAsync(int id) => Ok(await _semesterService.DeleteAsync(id));

    [HttpGet("options")]
    public async Task<IActionResult> OptionsAsync([FromQuery] int? academicYearId) => Ok(await _semesterService.OptionsAsync(academicYearId));
}