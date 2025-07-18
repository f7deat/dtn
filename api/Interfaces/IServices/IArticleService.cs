using THPCore.Models;
using YouthUnion.Entities;
using YouthUnion.Models;
using YouthUnion.Models.Articles;

namespace YouthUnion.Interfaces.IServices;

public interface IArticleService
{
    Task<THPResult> CreateAsync(Article args);
    Task<THPResult> DeleteAsync(Guid id);
    Task<object?> GetAsync(string normalizedName);
    Task<object?> GetAsync(Guid id);
    Task<ListResult<ArticleListItem>> ListAsync(ArticleFilterOptions filterOptions);
    Task<THPResult> UpdateAsync(Article args);
}
