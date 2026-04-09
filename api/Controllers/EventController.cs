using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using System.IO;
using THPCore.Models;
using YouthUnion.Core.Interfaces.IServices;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;
using YouthUnion.Foundation;

namespace YouthUnion.API.Controllers;

public class EventController(IEventService _eventService) : BaseController
{
    [HttpGet("list")]
    public async Task<IActionResult> ListAsync([FromQuery] EventFilterOptions filterOptions) => Ok(await _eventService.ListAsync(filterOptions));

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] EventCreateArgs args) => Ok(await _eventService.CreateAsync(args));

    [HttpPut]
    public async Task<IActionResult> UpdateAsync([FromBody] EventUpdateArgs args) => Ok(await _eventService.UpdateAsync(args));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAsync([FromRoute] Guid id) => Ok(await _eventService.DetailAsync(id));

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync([FromRoute] Guid id) => Ok(await _eventService.DeleteAsync(id));

    [HttpGet("users")]
    public async Task<IActionResult> GetUsersAsync([FromQuery] EUFilterOptions filterOptions) => Ok(await _eventService.GetUsersAsync(filterOptions));

    [HttpGet("my-events")]
    public async Task<IActionResult> GetMyEventsAsync([FromQuery] FilterOptions filterOptions) => Ok(await _eventService.GetMyEventsAsync(filterOptions));

    [HttpPost("add-user")]
    public async Task<IActionResult> AddUserAsync([FromBody] EventUserAddArgs args) => Ok(await _eventService.AddUserAsync(args));

    [HttpPost("remove-user")]
    public async Task<IActionResult> RemoveUserAsync([FromBody] EventUserRemoveArgs args) => Ok(await _eventService.RemoveUserAsync(args));

    [HttpPost("qr")]
    public async Task<IActionResult> GenerateQrAsync([FromBody] EventUserQrArgs args) => Ok(await _eventService.GenerateQrAsync(args));

    [HttpPost("check-in")]
    public async Task<IActionResult> CheckInAsync([FromBody] EventCheckInArgs args) => Ok(await _eventService.CheckInAsync(args));

    [HttpGet("my-qr/{eventId}")]
    public async Task<IActionResult> GetMyQrAsync([FromRoute] Guid eventId) => Ok(await _eventService.GetMyQrAsync(eventId));

    [HttpGet("check-in/export/{id}")]
    public async Task<IActionResult> ExportCheckInAsync([FromRoute] Guid id)
    {
        var result = await _eventService.GetCheckInExportAsync(id);
        if (!result.Succeeded)
        {
            return BadRequest(result.Message);
        }
        if (result.Data?.Items is null) return BadRequest("Data not found");
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("CheckIn");
        var headers = new[]
        {
            "STT",
            "Mã SV",
            "Họ tên",
            "Lớp",
            "Khoa",
            "Giới tính",
            "Ngày sinh",
            "SĐT",
            "Check-in lúc",
            "Check-in bởi"
        };

        for (var i = 0; i < headers.Length; i++)
        {
            worksheet.Cells[1, i + 1].Value = headers[i];
        }

        worksheet.Row(1).Style.Font.Bold = true;

        var row = 2;
        foreach (var item in result.Data.Items)
        {
            worksheet.Cells[row, 1].Value = row - 1;
            worksheet.Cells[row, 2].Value = item.UserName;
            worksheet.Cells[row, 3].Value = item.Name;
            worksheet.Cells[row, 4].Value = item.ClassCode;
            worksheet.Cells[row, 5].Value = item.DepartmentName;
            worksheet.Cells[row, 6].Value = item.Gender.HasValue ? (item.Gender.Value ? "Nữ" : "Nam") : null;
            worksheet.Cells[row, 7].Value = item.DateOfBirth?.ToString("dd/MM/yyyy");
            worksheet.Cells[row, 8].Value = item.PhoneNumber;
            worksheet.Cells[row, 9].Value = item.CheckedInAt?.ToString("dd/MM/yyyy HH:mm");
            worksheet.Cells[row, 10].Value = item.CheckedInBy;
            row++;
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
        worksheet.Cells[worksheet.Dimension.Address].Style.Border.Top.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
        worksheet.Cells[worksheet.Dimension.Address].Style.Border.Left.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
        worksheet.Cells[worksheet.Dimension.Address].Style.Border.Right.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;
        worksheet.Cells[worksheet.Dimension.Address].Style.Border.Bottom.Style = OfficeOpenXml.Style.ExcelBorderStyle.Thin;

        var fileName = BuildCheckInFileName(result.Data.Title);
        return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private static string BuildCheckInFileName(string title)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var safeTitle = string.Join("_", title.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        if (string.IsNullOrWhiteSpace(safeTitle))
        {
            safeTitle = "check-in";
        }

        return $"check-in_{safeTitle}_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
    }
}
