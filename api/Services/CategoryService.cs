using Microsoft.EntityFrameworkCore;
using THPCore.Models;
using YouthUnion.Data;
using YouthUnion.Entities;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models.Categories;

namespace YouthUnion.Services;

public class CategoryService(ApplicationDbContext _context) : ICategoryService
{
    public async Task<THPResult> CreateAsync(CategoryCreateRequest request)
    {
        await _context.Categories.AddAsync(new Category
        {
            Name = request.Name
        });
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    public async Task<THPResult> DeleteAsync(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category is null) return THPResult.Failed("Category not found");

        // Check if the category has articles
        if (_context.Articles.Any(x => x.CategoryId == id)) return THPResult.Failed("Cannot delete category with existing articles");
        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

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

    public async Task<object?> OptionsAsync() => await _context.Categories.Select(x => new
    {
        Value = x.Id,
        Label = x.Name
    })
        .ToListAsync();

    public async Task<THPResult> UpdateAsync(CategoryUpdateRequest request)
    {
        var category = await _context.Categories.FindAsync(request.Id);
        if (category is null) return THPResult.Failed("Category not found");
        category.Name = request.Name;
        _context.Categories.Update(category);
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }
}
