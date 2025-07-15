using THPCore.Models;
using YouthUnion.Models;

namespace YouthUnion.Interfaces.IServices;

public interface IArticleService
{
    Task<ListResult<object>> ListAsync(ArticleFilterOptions filterOptions);
}
