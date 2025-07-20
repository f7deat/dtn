using THPCore.Models;
using YouthUnion.Models.Categories;

namespace YouthUnion.Interfaces.IServices;

public interface ICategoryService
{
    Task<ListResult<object>> ListAsync(CategoryFilterOptions filterOptions);
}
