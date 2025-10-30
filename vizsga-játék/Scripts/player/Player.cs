using Godot;
using System;

public partial class Player : CharacterBody2D
{
	public const float Speed = 80.0f;

	//Fa gyűjtés
	public int WoodCount { get; private set; } = 0;


	private string lastDirection = "Down"; // utolsó nézésirány

	//Mozgás és animáció
	public override void _PhysicsProcess(double delta)
	{
		Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");
		Velocity = direction * Speed;
		MoveAndSlide();

		// Animációk kezelése
		// Ha csak függőleges irányba mozog a karakter
		if (direction != Vector2.Zero && Input.IsActionPressed("move_left") == false && Input.IsActionPressed("move_right") == false)
		{
			// Fel és le mozgás animáció

			// Ha felmegy
			if (Input.IsActionPressed("move_up"))
			{
				GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Up";
				lastDirection = "Up";
			}
			// Ha lemegy
			else if (Input.IsActionPressed("move_down"))
			{
				GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Down";
				lastDirection = "Down";
			}
			GetNode<AnimatedSprite2D>("AnimatedSprite2D").Play();
		}
		// Ha csak vízszintes irányba mozog a karakter
		else if (direction != Vector2.Zero && Input.IsActionPressed("move_up") == false && Input.IsActionPressed("move_down") == false)
		{
			// Jobb és bal mozgás animáció

			// Ha balra megy
			if (Input.IsActionPressed("move_left"))
			{
				GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Right";
				GetNode<AnimatedSprite2D>("AnimatedSprite2D").FlipH = true;
				lastDirection = "Left";
			}
			// Ha jobbra megy
			else if (Input.IsActionPressed("move_right"))
			{
				GetNode<AnimatedSprite2D>("AnimatedSprite2D").FlipH = false;
				GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Right";
				lastDirection = "Right";
			}
			GetNode<AnimatedSprite2D>("AnimatedSprite2D").Play();
		}
		// Ha megáll a karakter
		else if (direction == Vector2.Zero)
		{
			switch (lastDirection)
			{
				case "Up":
					GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Up_idle";
					break;
				case "Down":
					GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Down_idle";
					break;
				case "Left":
					GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Right_idle";
					GetNode<AnimatedSprite2D>("AnimatedSprite2D").FlipH = true;
					break;
				case "Right":
					GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Right_idle";
					GetNode<AnimatedSprite2D>("AnimatedSprite2D").FlipH = false;
					break;
			}
			GetNode<AnimatedSprite2D>("AnimatedSprite2D").Play();
		}
		else
		{
			GetNode<AnimatedSprite2D>("AnimatedSprite2D").Play();
		}

	}
	public void AddWood(int amount)
	{
		WoodCount += amount;
		GD.Print($"Fa gyűjtve! Összes fa: {WoodCount}");
	}
}