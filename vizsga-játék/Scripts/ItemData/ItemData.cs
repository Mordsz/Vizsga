using Godot;
using System;

[GlobalClass]
public partial class ItemData : Resource
{
    public enum ItemType
    {
        MAIN,
        Consumable,
        Equipment,
        Quest
    }

    [Export]
    public string Name { get; set; } = "";

    [Export(PropertyHint.MultilineText)]
    public string Description { get; set; } = "";

    [Export]
    public ItemType Type { get; set; }

    [Export]
    public Texture2D Texture { get; set; }
}

