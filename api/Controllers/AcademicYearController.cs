using Microsoft.AspNetCore.Mvc;
using YouthUnion.Foundation;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.AcademicYears;

namespace YouthUnion.Controllers;

[Route("academic-year")]
public class AcademicYearController(IAcademicYearService _academicYearService) : BaseController
{
    [HttpGet("list")]
    public async Task<IActionResult> ListAsync([FromQuery] AcademicYearFilterOptions filterOptions) => Ok(await _academicYearService.ListAsync(filterOptions));

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] AcademicYearCreateRequest request) => Ok(await _academicYearService.CreateAsync(request));

    [HttpPut]
    public async Task<IActionResult> UpdateAsync([FromBody] AcademicYearUpdateRequest request) => Ok(await _academicYearService.UpdateAsync(request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAsync(int id) => Ok(await _academicYearService.DeleteAsync(id));

    [HttpGet("options")]
    public async Task<IActionResult> OptionsAsync() => Ok(await _academicYearService.OptionsAsync());
}
