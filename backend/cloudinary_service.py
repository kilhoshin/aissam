import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
import os
from dotenv import load_dotenv

load_dotenv()

class CloudinaryService:
    def __init__(self):
        # Cloudinary 설정
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True  # HTTPS 사용
        )
    
    def upload_image(self, file_data, filename, folder="aissam_uploads"):
        """
        이미지를 Cloudinary에 업로드
        
        Args:
            file_data: 이미지 파일 데이터 (bytes)
            filename: 원본 파일명
            folder: Cloudinary 폴더명
            
        Returns:
            dict: 업로드 결과 (url, public_id 등)
        """
        try:
            # 파일명에서 확장자 제거하고 public_id 생성
            public_id = f"{folder}/{filename.split('.')[0]}_{cloudinary.utils.archive_params()['timestamp']}"
            
            # Cloudinary에 업로드
            result = cloudinary.uploader.upload(
                file_data,
                public_id=public_id,
                folder=folder,
                resource_type="image",
                # 이미지 최적화 옵션
                quality="auto:good",
                fetch_format="auto",
                # 메타데이터
                context={
                    "alt": f"AISSAM uploaded image: {filename}",
                    "caption": f"Student uploaded: {filename}"
                }
            )
            
            return {
                "success": True,
                "url": result.get("secure_url"),
                "public_id": result.get("public_id"),
                "width": result.get("width"),
                "height": result.get("height"),
                "format": result.get("format"),
                "bytes": result.get("bytes")
            }
            
        except Exception as e:
            print(f"Cloudinary upload error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def delete_image(self, public_id):
        """
        Cloudinary에서 이미지 삭제
        
        Args:
            public_id: Cloudinary public_id
            
        Returns:
            bool: 삭제 성공 여부
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
        except Exception as e:
            print(f"Cloudinary delete error: {e}")
            return False
    
    def get_optimized_url(self, public_id, width=None, height=None, quality="auto:good"):
        """
        최적화된 이미지 URL 생성
        
        Args:
            public_id: Cloudinary public_id
            width: 원하는 가로 크기
            height: 원하는 세로 크기
            quality: 품질 설정
            
        Returns:
            str: 최적화된 이미지 URL
        """
        try:
            transformation = {
                "quality": quality,
                "fetch_format": "auto"
            }
            
            if width:
                transformation["width"] = width
            if height:
                transformation["height"] = height
                
            url, _ = cloudinary_url(
                public_id,
                **transformation
            )
            return url
        except Exception as e:
            print(f"Cloudinary URL generation error: {e}")
            return None
