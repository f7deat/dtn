using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using THPCore.Infrastructures;

namespace YouthUnion.Entities;

public class Article : AuditEntity
{
    [StringLength(512)]
    public string Title { get; set; } = default!;
    [StringLength(1024)]
    public string Description { get; set; } = default!;

    [StringLength(512)]
    public string NormalizedName { get; set; } = default!;
    public int ViewCount { get; set; }
    public string Content { get; set; } = default!;
    [ForeignKey(nameof(Category))]
    public int? CategoryId { get; set; }
    [StringLength(2048)]
    public string Thumbnail { get; set; } = default!;
    public bool IsActive { get; set; }

    public Category? Category { get; set; }
}
