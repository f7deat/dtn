using THPCore.Infrastructures;

namespace YouthUnion.Models.Articles;

public class ArticleListItem : AuditEntity
{
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public int ViewCount { get; set; }
    public string NormalizedName { get; set; } = default!;
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public bool IsActive { get; set; }
    public string? Thumbnail { get; set; }
}
