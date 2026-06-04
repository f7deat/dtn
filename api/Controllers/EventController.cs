using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using THPCore.Models;
using YouthUnion.Core.Interfaces.IServices;
using YouthUnion.Core.Services.Events.Args;
using YouthUnion.Core.Services.Events.Filters;
using YouthUnion.Core.Services.Events.Models;
using YouthUnion.ExternalAPI;
using YouthUnion.ExternalAPI.Models.Response;
using YouthUnion.Foundation;

namespace YouthUnion.Controllers;

public class EventController(IEventService _eventService, IHemsService _hemsService) : BaseController
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

    [HttpPost("scan")]
    public async Task<IActionResult> ScanQrAsync([FromBody] EventCheckInArgs args) => Ok(await _eventService.ScanQrAsync(args));

    [HttpPost("check-in")]
    public async Task<IActionResult> CheckInAsync([FromBody] EventCheckInArgs args) => Ok(await _eventService.ScanQrAsync(args));

    [HttpGet("my-qr/{eventId}")]
    public async Task<IActionResult> GetMyQrAsync([FromRoute] Guid eventId) => Ok(await _eventService.GetMyQrAsync(eventId));

    [HttpGet("my-events/{eventId}/attendance-history")]
    public async Task<IActionResult> GetMyAttendanceHistoryAsync([FromRoute] Guid eventId)
        => Ok(await _eventService.GetMyAttendanceHistoryAsync(eventId));

    [HttpGet("check-in/export/{id}")]
    public async Task<IActionResult> ExportCheckInAsync([FromRoute] Guid id, [FromQuery] DateOnly? attendanceDate)
    {
        var result = await _eventService.GetCheckInExportAsync(id, attendanceDate);
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
            "Niên khóa",
            "Ngày điểm danh",
            "Check-in lúc",
            "Check-in bởi",
            "Checkout lúc",
            "Checkout bởi"
        };

        for (var i = 0; i < headers.Length; i++)
        {
            worksheet.Cells[1, i + 1].Value = headers[i];
        }

        worksheet.Row(1).Style.Font.Bold = true;
        var userNames = result.Data.Items.Select(i => i.UserName).Distinct().ToList();
        var userInfos = new List<ListByUserNamesResponse>();
        var batchSize = 1000;
        var pages = (int)Math.Ceiling(userNames.Count / (double)batchSize);

        for (var page = 1; page <= pages; page++)
        {
            var batchUserNames = userNames.Skip((page - 1) * batchSize).Take(batchSize).ToList();
            var batchResponse = await _hemsService.ListByUserNamesAsync(batchUserNames!);
            if (batchResponse.Data is not null)
            {
                userInfos.AddRange(batchResponse.Data);
            }
        }

        void PopulateWorksheet(string sheetName, IEnumerable<YouthUnion.Core.Services.Events.Models.EventCheckInExportItem> sourceItems)
        {
            var sheet = package.Workbook.Worksheets.Add(sheetName);
            for (var i = 0; i < headers.Length; i++)
            {
                sheet.Cells[1, i + 1].Value = headers[i];
            }

            sheet.Row(1).Style.Font.Bold = true;

            var items = sourceItems
                .OrderBy(x => x.UserName)
                .ThenBy(x => x.CheckedInAt)
                .ToList();

            var row = 2;
            foreach (var item in items)
            {
                var studentInfo = userInfos.FirstOrDefault(r => r.UserName == item.UserName);

                sheet.Cells[row, 1].Value = row - 1;
                sheet.Cells[row, 2].Value = item.UserName;
                sheet.Cells[row, 3].Value = item.Name;
                sheet.Cells[row, 4].Value = studentInfo?.ClassCode;
                sheet.Cells[row, 5].Value = item.DepartmentName;
                sheet.Cells[row, 6].Value = item.Gender.HasValue ? (item.Gender.Value ? "Nữ" : "Nam") : null;
                sheet.Cells[row, 7].Value = item.DateOfBirth?.ToString("dd/MM/yyyy");
                sheet.Cells[row, 8].Value = item.PhoneNumber;
                sheet.Cells[row, 9].Value = studentInfo?.CourseName;
                sheet.Cells[row, 10].Value = item.AttendanceDate.ToString("dd/MM/yyyy");
                sheet.Cells[row, 11].Value = item.CheckedInAt?.ToString("dd/MM/yyyy HH:mm");
                sheet.Cells[row, 12].Value = item.CheckedInBy;
                sheet.Cells[row, 13].Value = item.CheckedOutAt?.ToString("dd/MM/yyyy HH:mm");
                sheet.Cells[row, 14].Value = item.CheckedOutBy;
                row++;
            }

            if (sheet.Dimension is null)
            {
                return;
            }

            sheet.Cells[sheet.Dimension.Address].AutoFitColumns();
            sheet.Cells[sheet.Dimension.Address].Style.Border.Top.Style = ExcelBorderStyle.Thin;
            sheet.Cells[sheet.Dimension.Address].Style.Border.Left.Style = ExcelBorderStyle.Thin;
            sheet.Cells[sheet.Dimension.Address].Style.Border.Right.Style = ExcelBorderStyle.Thin;
            sheet.Cells[sheet.Dimension.Address].Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
        }

        package.Workbook.Worksheets.Delete(worksheet);

        var hasSheet = false;
        if (attendanceDate.HasValue)
        {
            var itemsInDay = result.Data.Items.Where(x => x.AttendanceDate == attendanceDate.Value);
            PopulateWorksheet(BuildAttendanceSheetName(attendanceDate.Value), itemsInDay);
            hasSheet = true;
        }
        else if (result.Data.StartDate.HasValue && result.Data.EndDate.HasValue && result.Data.StartDate.Value <= result.Data.EndDate.Value)
        {
            for (var date = result.Data.StartDate.Value; date <= result.Data.EndDate.Value; date = date.AddDays(1))
            {
                var itemsInDay = result.Data.Items.Where(x => x.AttendanceDate == date);
                PopulateWorksheet(BuildAttendanceSheetName(date), itemsInDay);
                hasSheet = true;
            }
        }
        else
        {
            foreach (var dayGroup in result.Data.Items.GroupBy(x => x.AttendanceDate).OrderBy(x => x.Key))
            {
                PopulateWorksheet(BuildAttendanceSheetName(dayGroup.Key), dayGroup);
                hasSheet = true;
            }
        }

        if (!hasSheet)
        {
            PopulateWorksheet("CheckIn", Enumerable.Empty<YouthUnion.Core.Services.Events.Models.EventCheckInExportItem>());
        }

        var fileName = BuildCheckInFileName(result.Data.Title, attendanceDate);
        return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpPost("check-in/import/{id}")]
    public async Task<IActionResult> ImportCheckInAsync([FromRoute] Guid id, IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("File không hợp lệ.");
        }

        if (!Path.GetExtension(file.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Chỉ hỗ trợ file .xlsx.");
        }

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        var importItems = new List<EventCheckInImportItem>();

        await using var stream = file.OpenReadStream();
        using var package = new ExcelPackage(stream);
        foreach (var worksheet in package.Workbook.Worksheets)
        {
            if (worksheet.Dimension is null)
            {
                continue;
            }

            var sheetAttendanceDate = TryParseAttendanceDateFromSheetName(worksheet.Name);

            for (var row = 2; row <= worksheet.Dimension.End.Row; row++)
            {
                var userName = worksheet.Cells[row, 2].Text?.Trim();
                if (string.IsNullOrWhiteSpace(userName))
                {
                    continue;
                }

                var attendanceDate = ReadDateOnly(worksheet.Cells[row, 10].Value)
                    ?? sheetAttendanceDate;
                if (!attendanceDate.HasValue)
                {
                    continue;
                }

                var checkedInAt = ReadDateTime(worksheet.Cells[row, 11].Value);
                var checkedInBy = worksheet.Cells[row, 12].Text?.Trim();
                var checkedOutAt = ReadDateTime(worksheet.Cells[row, 13].Value);
                var checkedOutBy = worksheet.Cells[row, 14].Text?.Trim();

                importItems.Add(new EventCheckInImportItem(
                    userName,
                    attendanceDate.Value,
                    checkedInAt,
                    string.IsNullOrWhiteSpace(checkedInBy) ? null : checkedInBy,
                    checkedOutAt,
                    string.IsNullOrWhiteSpace(checkedOutBy) ? null : checkedOutBy));
            }
        }

        var result = await _eventService.ImportCheckInAsync(id, importItems);
        if (!result.Succeeded)
        {
            return BadRequest(result.Message);
        }

        return Ok(result);
    }

    [HttpGet("check-in/import-template/{id}")]
    public async Task<IActionResult> DownloadImportTemplateAsync([FromRoute] Guid id)
    {
        var result = await _eventService.GetCheckInExportAsync(id);
        if (!result.Succeeded)
        {
            return BadRequest(result.Message);
        }

        if (result.Data is null)
        {
            return BadRequest("Không lấy được dữ liệu sự kiện.");
        }

        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        using var package = new ExcelPackage();
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
            "Niên khóa",
            "Ngày điểm danh",
            "Check-in lúc",
            "Check-in bởi",
            "Checkout lúc",
            "Checkout bởi"
        };

        void CreateTemplateWorksheet(string sheetName, DateOnly date)
        {
            var sheet = package.Workbook.Worksheets.Add(sheetName);
            for (var i = 0; i < headers.Length; i++)
            {
                sheet.Cells[1, i + 1].Value = headers[i];
            }

            sheet.Row(1).Style.Font.Bold = true;
            // Pre-fill attendance date column to reduce manual input errors.
            sheet.Cells[2, 10].Value = date.ToString("dd/MM/yyyy");

            if (sheet.Dimension is null)
            {
                return;
            }

            sheet.Cells[sheet.Dimension.Address].AutoFitColumns();
            sheet.Cells[sheet.Dimension.Address].Style.Border.Top.Style = ExcelBorderStyle.Thin;
            sheet.Cells[sheet.Dimension.Address].Style.Border.Left.Style = ExcelBorderStyle.Thin;
            sheet.Cells[sheet.Dimension.Address].Style.Border.Right.Style = ExcelBorderStyle.Thin;
            sheet.Cells[sheet.Dimension.Address].Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
        }

        if (result.Data.StartDate.HasValue && result.Data.EndDate.HasValue && result.Data.StartDate.Value <= result.Data.EndDate.Value)
        {
            for (var date = result.Data.StartDate.Value; date <= result.Data.EndDate.Value; date = date.AddDays(1))
            {
                CreateTemplateWorksheet(BuildAttendanceSheetName(date), date);
            }
        }
        else
        {
            var fallbackDate = DateOnly.FromDateTime(DateTime.Today);
            CreateTemplateWorksheet(BuildAttendanceSheetName(fallbackDate), fallbackDate);
        }

        var fileName = BuildImportTemplateFileName(result.Data.Title);
        return File(package.GetAsByteArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private static string BuildAttendanceSheetName(DateOnly date) => $"Ngay_{date:dd-MM-yyyy}";

    private static string BuildImportTemplateFileName(string title)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var safeTitle = string.Join("_", title.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        if (string.IsNullOrWhiteSpace(safeTitle))
        {
            safeTitle = "check-in-template";
        }

        return $"check-in-template_{safeTitle}_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
    }

    private static string BuildCheckInFileName(string title, DateOnly? attendanceDate = null)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var safeTitle = string.Join("_", title.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        if (string.IsNullOrWhiteSpace(safeTitle))
        {
            safeTitle = "check-in";
        }

        var dateSuffix = attendanceDate.HasValue ? $"_{attendanceDate.Value:yyyyMMdd}" : string.Empty;
        return $"check-in_{safeTitle}{dateSuffix}_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
    }

    private static DateOnly? TryParseAttendanceDateFromSheetName(string sheetName)
    {
        if (string.IsNullOrWhiteSpace(sheetName))
        {
            return null;
        }

        var normalized = sheetName.Trim();
        if (normalized.StartsWith("Ngay_", StringComparison.OrdinalIgnoreCase))
        {
            normalized = normalized[5..];
        }

        if (DateOnly.TryParseExact(normalized, "dd-MM-yyyy", out var date))
        {
            return date;
        }

        if (DateOnly.TryParse(normalized, out date))
        {
            return date;
        }

        return null;
    }

    private static DateOnly? ReadDateOnly(object? value)
    {
        if (value is null)
        {
            return null;
        }

        if (value is DateOnly dateOnly)
        {
            return dateOnly;
        }

        if (value is DateTime dateTime)
        {
            return DateOnly.FromDateTime(dateTime);
        }

        if (value is double excelDate)
        {
            return DateOnly.FromDateTime(DateTime.FromOADate(excelDate));
        }

        var text = value.ToString();
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        if (DateOnly.TryParseExact(text, "dd/MM/yyyy", out var parsedDate))
        {
            return parsedDate;
        }

        if (DateOnly.TryParse(text, out parsedDate))
        {
            return parsedDate;
        }

        return null;
    }

    private static DateTime? ReadDateTime(object? value)
    {
        if (value is null)
        {
            return null;
        }

        if (value is DateTime dateTime)
        {
            return dateTime;
        }

        if (value is double excelDate)
        {
            return DateTime.FromOADate(excelDate);
        }

        var text = value.ToString();
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        if (DateTime.TryParseExact(text, "dd/MM/yyyy HH:mm", null, System.Globalization.DateTimeStyles.None, out var parsedDateTime))
        {
            return parsedDateTime;
        }

        if (DateTime.TryParse(text, out parsedDateTime))
        {
            return parsedDateTime;
        }

        return null;
    }
}
