using THPCore.Models;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models;

namespace YouthUnion.Services;

public class ArticleService : IArticleService
{
    public Task<ListResult<object>> ListAsync(ArticleFilterOptions filterOptions)
    {
        throw new NotImplementedException();
    }
}
