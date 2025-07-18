using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YouthUnion.Entities;
using YouthUnion.Foundation;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models;

namespace YouthUnion.Controllers;

public class ArticleController(IArticleService _articleService) : BaseController
{
    [HttpGet("list"), AllowAnonymous]
    public async Task<IActionResult> ListAsync([FromQuery] ArticleFilterOptions filterOptions) => Ok(await _articleService.ListAsync(filterOptions));

    [HttpPost("create")]
    public async Task<IActionResult> CreateAsync([FromBody] Article args) => Ok(await _articleService.CreateAsync(args));

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync([FromRoute] Guid id) => Ok(await _articleService.DeleteAsync(id));

    [HttpGet("{normalizedName}"), AllowAnonymous]
    public async Task<IActionResult> GetAsync([FromRoute] string normalizedName) => Ok(new { data = await _articleService.GetAsync(normalizedName) });
}
