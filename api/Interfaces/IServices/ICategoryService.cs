using THPCore.Models;
using YouthUnion.Models.Categories;

namespace YouthUnion.Interfaces.IServices;

public interface ICategoryService
{
    Task<THPResult> CreateAsync(CategoryCreateRequest request);
    Task<THPResult> DeleteAsync(int id);
    Task<ListResult<object>> ListAsync(CategoryFilterOptions filterOptions);
    Task<object?> OptionsAsync();
    Task<THPResult> UpdateAsync(CategoryUpdateRequest request);
}
