using Microsoft.AspNetCore.Mvc;
using YouthUnion.Foundation;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Categories;

namespace YouthUnion.Controllers;

public class CategoryController(ICategoryService _categoryService) : BaseController
{
    [HttpGet("list")]
    public async Task<IActionResult> ListAsync([FromQuery] CategoryFilterOptions filterOptions) => Ok(await _categoryService.ListAsync(filterOptions));

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CategoryCreateRequest request) => Ok(await _categoryService.CreateAsync(request));

    [HttpPut]
    public async Task<IActionResult> UpdateAsync([FromBody] CategoryUpdateRequest request) => Ok(await _categoryService.UpdateAsync(request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAsync(int id) => Ok(await _categoryService.DeleteAsync(id));

    [HttpGet("options")]
    public async Task<IActionResult> OptionsAsync() => Ok(await _categoryService.OptionsAsync());
}
