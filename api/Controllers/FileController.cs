using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using THPCore.Extensions;
using YouthUnion.Foundation;
using YouthUnion.Models;

namespace YouthUnion.Controllers;

public class FileController(IWebHostEnvironment _webHostEnvironment) : BaseController
{
    [HttpPost("upload")]
    public async Task<IActionResult> UploadAsync([FromForm] UploadArgs args)
    {
        try
        {
            if (args.File is null) return BadRequest("File not found!");

            var folder = User.GetUserName();
            var uploadPath = Path.Combine(_webHostEnvironment.WebRootPath, "files", folder);

            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);
            var filePath = Path.Combine(uploadPath, args.File.FileName);

            using (var stream = System.IO.File.Create(filePath))
            {
                await args.File.CopyToAsync(stream);
            }
            var host = Request.Host.Value;
            var url = $"https://{host}/files/{folder}/{args.File.FileName}";

            return Ok(new { succeeded = true, url });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.ToString());
        }
    }
}
