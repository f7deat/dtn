using THPCore.Models;

namespace YouthUnion.Models;

public class ArticleFilterOptions : FilterOptions
{
    public string? Title { get; set; }
    public int? CategoryId { get; set; }
}
