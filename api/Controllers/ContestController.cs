using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using YouthUnion.Foundation;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Contests;

namespace YouthUnion.Controllers;

public class ContestController(IContestService _contestService) : BaseController
{
    [HttpGet("list"), AllowAnonymous]
    public async Task<IActionResult> ListAsync([FromQuery] ContestFilterOptions filterOptions)
    {
        var onlyActive = !(User.Identity?.IsAuthenticated ?? false);
        return Ok(await _contestService.ListAsync(filterOptions, onlyActive));
    }

    [HttpGet("{id}"), AllowAnonymous]
    public async Task<IActionResult> GetAsync([FromRoute] Guid id)
    {
        var onlyActive = !(User.Identity?.IsAuthenticated ?? false);
        return Ok(new { data = await _contestService.GetAsync(id, onlyActive) });
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] ContestCreateArgs args) => Ok(await _contestService.CreateAsync(args));

    [HttpPut]
    public async Task<IActionResult> UpdateAsync([FromBody] ContestUpdateArgs args) => Ok(await _contestService.UpdateAsync(args));

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync([FromRoute] Guid id) => Ok(await _contestService.DeleteAsync(id));

    [HttpGet("{id}/submissions")]
    public async Task<IActionResult> GetSubmissionsAsync([FromRoute] Guid id, [FromQuery] ContestSubmissionFilterOptions filterOptions)
        => Ok(await _contestService.GetSubmissionsAsync(id, filterOptions));

    [HttpGet("{id}/my-submissions")]
    public async Task<IActionResult> GetMySubmissionsAsync([FromRoute] Guid id)
        => Ok(new { data = await _contestService.GetMySubmissionsAsync(id) });

    [HttpPut("submission-status")]
    public async Task<IActionResult> UpdateSubmissionStatusAsync([FromBody] ContestSubmissionStatusUpdateArgs args)
        => Ok(await _contestService.UpdateSubmissionStatusAsync(args));

    [HttpDelete("submissions/{submissionId}")]
    public async Task<IActionResult> DeleteSubmissionAsync([FromRoute] Guid submissionId)
        => Ok(await _contestService.DeleteSubmissionAsync(submissionId));

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> SubmitAsync([FromRoute] Guid id, [FromForm] IFormFile file, [FromForm] string? note)
        => Ok(await _contestService.SubmitAsync(id, file, note));

    [HttpGet("{id}/submissions/export")]
    public async Task<IActionResult> ExportSubmissionsAsync([FromRoute] Guid id)
    {
        var exportData = await _contestService.GetSubmissionExportAsync(id);
        if (exportData is null)
        {
            return BadRequest("Không tìm thấy cuộc thi.");
        }

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Submissions");
        var headers = new[]
        {
            "STT",
            "Mã sinh viên",
            "Họ tên",
            "Email",
            "Số điện thoại",
            "Khóa học",
            "Lớp học",
            "Khoa",
            "Tên file",
            "Link file",
            "Ghi chú",
            "Trạng thái",
            "Ghi chú quản trị",
            "Thời gian nộp"
        };

        for (var i = 0; i < headers.Length; i++)
        {
            worksheet.Cells[1, i + 1].Value = headers[i];
        }

        worksheet.Row(1).Style.Font.Bold = true;

        for (var index = 0; index < exportData.Value.Items.Count; index++)
        {
            var item = exportData.Value.Items[index];
            var row = index + 2;
            worksheet.Cells[row, 1].Value = index + 1;
            worksheet.Cells[row, 2].Value = item.UserName;
            worksheet.Cells[row, 3].Value = item.FullName;
            worksheet.Cells[row, 4].Value = item.Email;
            worksheet.Cells[row, 5].Value = item.PhoneNumber;
            worksheet.Cells[row, 6].Value = item.CourseName;
            worksheet.Cells[row, 7].Value = item.ClassName;
            worksheet.Cells[row, 8].Value = item.FacultyName;
            worksheet.Cells[row, 9].Value = item.OriginalFileName;
            worksheet.Cells[row, 10].Value = item.FileUrl;
            worksheet.Cells[row, 11].Value = item.Note;
            worksheet.Cells[row, 12].Value = item.Status switch
            {
                YouthUnion.Core.Entities.ContestSubmissionStatus.Approved => "Đã duyệt",
                YouthUnion.Core.Entities.ContestSubmissionStatus.Rejected => "Từ chối",
                _ => "Chờ duyệt"
            };
            worksheet.Cells[row, 13].Value = item.AdminNote;
            worksheet.Cells[row, 14].Value = item.SubmittedAt.ToString("dd/MM/yyyy HH:mm");
        }

        if (worksheet.Dimension is not null)
        {
            worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
            worksheet.Cells[worksheet.Dimension.Address].Style.Border.Top.Style = ExcelBorderStyle.Thin;
            worksheet.Cells[worksheet.Dimension.Address].Style.Border.Left.Style = ExcelBorderStyle.Thin;
            worksheet.Cells[worksheet.Dimension.Address].Style.Border.Right.Style = ExcelBorderStyle.Thin;
            worksheet.Cells[worksheet.Dimension.Address].Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
        }

        var fileName = $"contest-submissions-{SanitizeFileName(exportData.Value.ContestTitle)}.xlsx";
        return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private static string SanitizeFileName(string fileName)
    {
        foreach (var invalidChar in Path.GetInvalidFileNameChars())
        {
            fileName = fileName.Replace(invalidChar, '_');
        }

        return fileName.Replace(' ', '-').ToLowerInvariant();
    }
}