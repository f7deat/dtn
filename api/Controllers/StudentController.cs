using Microsoft.AspNetCore.Mvc;
using YouthUnion.Foundation;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Students;

namespace YouthUnion.Controllers;

public class StudentController(IStudentService _studentService) : BaseController
{
    [HttpGet("list")]
    public async Task<IActionResult> ListAsync([FromQuery] StudentFilterOptions filterOptions) => Ok(await _studentService.ListAsync(filterOptions));
}
