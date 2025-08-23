using Godot;
using System;

public partial class Player : CharacterBody2D
{
	public const float Speed = 80.0f;
	public override void _PhysicsProcess(double delta)
	{
		// Get the input direction and handle the movement/deceleration.
		// As good practice, you should replace UI actions with custom gameplay actions.
		Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");
		Velocity = direction * Speed;
		MoveAndSlide();

		// Ha csak függőleges irányba mozog a karakter
		if (direction != Vector2.Zero && Input.IsActionPressed("move_left") == false && Input.IsActionPressed("move_right") == false)
		{
			// Fel és le mozgás animáció

			// Ha felmegy
			if (Input.IsActionPressed("move_up"))
			{
				GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Up";
				
			}
			// Ha lemegy
			else if (Input.IsActionPressed("move_down"))
			{
				GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Down";
				
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
			}
			// Ha jobbra megy
			else if (Input.IsActionPressed("move_right"))
			{
				GetNode<AnimatedSprite2D>("AnimatedSprite2D").FlipH = false;
				GetNode<AnimatedSprite2D>("AnimatedSprite2D").Animation = "Right";
			}
			GetNode<AnimatedSprite2D>("AnimatedSprite2D").Play();
		}
		// Ha megáll a karakter
		else if (direction == Vector2.Zero)
		{
			GetNode<AnimatedSprite2D>("AnimatedSprite2D").Stop();
		}
		else
		{
			GetNode<AnimatedSprite2D>("AnimatedSprite2D").Play();
		}

	}
}
