using THPCore.Models;
using YouthUnion.Data;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Categories;

namespace YouthUnion.Services;

public class CategoryService(ApplicationDbContext _context) : ICategoryService
{
    public Task<ListResult<object>> ListAsync(CategoryFilterOptions filterOptions)
    {
        var query = from a in _context.Categories
                    select new
                    {
                        a.Id,
                        a.Name,
                        ArticleCount = _context.Articles.Count(x => x.CategoryId == a.Id)
                    };
        query = query.OrderBy(x => x.Name);
        return ListResult<object>.Success(query, filterOptions);
    }
}
