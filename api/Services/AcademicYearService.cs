using Microsoft.EntityFrameworkCore;
using THPCore.Models;
using YouthUnion.Core.Entities;
using YouthUnion.Infrastructure.Data;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.AcademicYears;

namespace YouthUnion.Services;

public class AcademicYearService(ApplicationDbContext _context) : IAcademicYearService
{
    public async Task<THPResult> CreateAsync(AcademicYearCreateRequest request)
    {
        var normalizedName = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName)) return THPResult.Failed("Tên năm học không được để trống");
        if (request.StartDate > request.EndDate) return THPResult.Failed("Ngày bắt đầu không được lớn hơn ngày kết thúc");

        if (await _context.AcademicYears.AnyAsync(x => x.Name == normalizedName))
            return THPResult.Failed("Năm học đã tồn tại");

        await _context.AcademicYears.AddAsync(new AcademicYear
        {
            Name = normalizedName,
            StartDate = request.StartDate,
            EndDate = request.EndDate
        });
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    public async Task<THPResult> DeleteAsync(int id)
    {
        var academicYear = await _context.AcademicYears.FindAsync(id);
        if (academicYear is null) return THPResult.Failed("Không tìm thấy năm học");

        if (await _context.Semesters.AnyAsync(x => x.AcademicYearId == id))
            return THPResult.Failed("Không thể xóa năm học đang chứa kỳ học");

        if (await _context.Events.AnyAsync(x => x.AcademicYearId == id))
            return THPResult.Failed("Không thể xóa năm học đang được dùng bởi sự kiện");

        _context.AcademicYears.Remove(academicYear);
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    public Task<ListResult<object>> ListAsync(AcademicYearFilterOptions filterOptions)
    {
        var query = from a in _context.AcademicYears
                    select new
                    {
                        a.Id,
                        a.Name,
                        a.StartDate,
                        a.EndDate,
                        SemesterCount = _context.Semesters.Count(x => x.AcademicYearId == a.Id),
                        EventCount = _context.Events.Count(x => x.AcademicYearId == a.Id)
                    };

        if (!string.IsNullOrWhiteSpace(filterOptions.Name))
        {
            var keyword = filterOptions.Name.Trim();
            query = query.Where(x => x.Name.Contains(keyword));
        }

        query = query.OrderByDescending(x => x.StartDate);
        return ListResult<object>.Success(query, filterOptions);
    }

    public async Task<object?> OptionsAsync()
    {
        return await _context.AcademicYears
            .OrderByDescending(x => x.StartDate)
            .Select(x => new
            {
                Value = x.Id,
                Label = x.Name,
                StartDate = x.StartDate,
                EndDate = x.EndDate
            })
            .ToListAsync();
    }

    public async Task<THPResult> UpdateAsync(AcademicYearUpdateRequest request)
    {
        var academicYear = await _context.AcademicYears.FindAsync(request.Id);
        if (academicYear is null) return THPResult.Failed("Không tìm thấy năm học");

        var normalizedName = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName)) return THPResult.Failed("Tên năm học không được để trống");
        if (request.StartDate > request.EndDate) return THPResult.Failed("Ngày bắt đầu không được lớn hơn ngày kết thúc");

        if (await _context.AcademicYears.AnyAsync(x => x.Id != request.Id && x.Name == normalizedName))
            return THPResult.Failed("Năm học đã tồn tại");

        academicYear.Name = normalizedName;
        academicYear.StartDate = request.StartDate;
        academicYear.EndDate = request.EndDate;

        _context.AcademicYears.Update(academicYear);
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }
}