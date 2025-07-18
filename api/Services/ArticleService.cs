using Microsoft.EntityFrameworkCore;
using THPCore.Helpers;
using THPCore.Interfaces;
using THPCore.Models;
using YouthUnion.Data;
using YouthUnion.Entities;
using YouthUnion.Interfaces.IServices;
using YouthUnion.Models;
using YouthUnion.Models.Articles;

namespace YouthUnion.Services;

public class ArticleService(ApplicationDbContext _context, IHCAService _hcaService) : IArticleService
{
    public async Task<THPResult> CreateAsync(Article args)
    {
        try
        {
            var normalizedName = SeoHelper.ToSeoFriendly(args.Title);
            if (await _context.Articles.AnyAsync(x => x.NormalizedName == normalizedName)) return THPResult.Failed("Bài viết đã tồn tại!");
            var article = new Article
            {
                Title = args.Title,
                Description = args.Description,
                CreatedBy = _hcaService.GetUserName(),
                CreatedDate = DateTime.Now,
                NormalizedName = normalizedName,
                CategoryId = args.CategoryId,
                Content = string.Empty,
                Thumbnail = string.Empty
            };
            await _context.Articles.AddAsync(article);
            await _context.SaveChangesAsync();
            return THPResult.Ok(article.Id);
        }
        catch (Exception ex)
        {
            return THPResult.Failed(ex.ToString());
        }
    }

    public async Task<THPResult> DeleteAsync(Guid id)
    {
        var data = await _context.Articles.FindAsync(id);
        if (data is null) return THPResult.Failed("Không tìm thấy bài viết!");
        _context.Articles.Remove(data);
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }

    public async Task<object?> GetAsync(string normalizedName)
    {
        var article = await _context.Articles.FirstOrDefaultAsync(x => x.NormalizedName == normalizedName && x.IsActive);
        if (article is null) return default;
        return new
        {
            article.Id,
            article.Title,
            article.Thumbnail,
            article.Description,
            article.CreatedDate,
            article.CreatedBy,
            article.IsActive,
            article.ModifiedBy,
            article.ViewCount,
            article.ModifiedDate,
            article.CategoryId,
            article.Content
        };
    }

    public async Task<object?> GetAsync(Guid id)
    {
        var article = await _context.Articles.FindAsync(id);
        if (article is null) return article;
        return new
        {
            article.Id,
            article.Title,
            article.Thumbnail,
            article.Description,
            article.CreatedDate,
            article.CreatedBy,
            article.IsActive,
            article.ModifiedBy,
            article.ViewCount,
            article.ModifiedDate,
            article.CategoryId,
            article.Content
        };
    }

    public async Task<ListResult<ArticleListItem>> ListAsync(ArticleFilterOptions filterOptions)
    {
        var query = from a in _context.Articles
                    join b in _context.Categories on a.CategoryId equals b.Id into ab
                    from b in ab.DefaultIfEmpty()
                    select new ArticleListItem
                    {
                        Id = a.Id,
                        Title = a.Title,
                        CreatedDate = a.CreatedDate,
                        CreatedBy = a.CreatedBy,
                        ModifiedBy = a.ModifiedBy,
                        ModifiedDate = a.ModifiedDate,
                        ViewCount = a.ViewCount,
                        IsActive = a.IsActive,
                        CategoryName = b.Name,
                        CategoryId = a.CategoryId,
                        NormalizedName = a.NormalizedName,
                        Description = a.Description
                    };
        if (!string.IsNullOrWhiteSpace(filterOptions.Title))
        {
            var normalizedName = SeoHelper.ToSeoFriendly(filterOptions.Title);
            query = query.Where(x => x.NormalizedName.Contains(normalizedName));
        }
        if (filterOptions.CategoryId != null)
        {
            query = query.Where(x => x.CategoryId == filterOptions.CategoryId);
        }
        if (filterOptions.IsActive != null)
        {
            query = query.Where(x => x.IsActive == filterOptions.IsActive);
        }
        query = query.OrderByDescending(x => x.CreatedDate);
        return await ListResult<ArticleListItem>.Success(query, filterOptions);
    }

    public async Task<THPResult> UpdateAsync(Article args)
    {
        var article = await _context.Articles.FindAsync(args.Id);
        if (article is null) return THPResult.Failed("Không tìm thấy bài viết!");
        article.Title = args.Title;
        article.Content = args.Content;
        article.ModifiedBy = _hcaService.GetUserName();
        article.ModifiedDate = DateTime.Now;
        article.CategoryId = args.CategoryId;
        article.Thumbnail = args.Thumbnail;
        article.IsActive = args.IsActive;
        article.Description = args.Description;
        _context.Articles.Update(article);
        await _context.SaveChangesAsync();
        return THPResult.Success;
    }
}
