using THPCore.Models;

namespace YouthUnion.Core.Services.Events.Filters;

public class EventFilterOptions : FilterOptions
{
    public string? Title { get; set; }
    public int? AcademicYearId { get; set; }
    public int? SemesterId { get; set; }
}