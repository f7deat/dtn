using THPCore.Models;

namespace YouthUnion.Models.Contests;

public class ContestFilterOptions : FilterOptions
{
    public string? Title { get; set; }

    public bool? IsActive { get; set; }

    public bool? IsOpened { get; set; }
}