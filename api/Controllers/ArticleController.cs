using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YouthUnion.Foundation;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models;

namespace YouthUnion.Controllers;

public class ArticleController(IArticleService _articleService) : BaseController
{
    [HttpGet("list"), AllowAnonymous]
    public async Task<IActionResult> ListAsync([FromQuery] ArticleFilterOptions filterOptions) => Ok(await _articleService.ListAsync(filterOptions));
}
