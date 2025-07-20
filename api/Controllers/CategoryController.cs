using Microsoft.AspNetCore.Mvc;
using YouthUnion.Foundation;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Categories;

namespace YouthUnion.Controllers;

public class CategoryController(ICategoryService _categoryService) : BaseController
{
    [HttpGet("list")]
    public async Task<IActionResult> ListAsync([FromQuery] CategoryFilterOptions filterOptions) => Ok(await _categoryService.ListAsync(filterOptions));
}
