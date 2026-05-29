using THPCore.Models;
using YouthUnion.Models.AcademicYears;

namespace YouthUnion.Interfaces.IServices;

public interface IAcademicYearService
{
    Task<THPResult> CreateAsync(AcademicYearCreateRequest request);
    Task<THPResult> DeleteAsync(int id);
    Task<ListResult<object>> ListAsync(AcademicYearFilterOptions filterOptions);
    Task<object?> OptionsAsync();
    Task<THPResult> UpdateAsync(AcademicYearUpdateRequest request);
}