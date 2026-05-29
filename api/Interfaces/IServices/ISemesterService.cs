using THPCore.Models;
using YouthUnion.Models.Semesters;

namespace YouthUnion.Interfaces.IServices;

public interface ISemesterService
{
    Task<THPResult> CreateAsync(SemesterCreateRequest request);
    Task<THPResult> DeleteAsync(int id);
    Task<ListResult<object>> ListAsync(SemesterFilterOptions filterOptions);
    Task<object?> OptionsAsync(int? academicYearId);
    Task<THPResult> UpdateAsync(SemesterUpdateRequest request);
}